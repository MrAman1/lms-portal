from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Course, Chapter, User, Enrollment
from app.schemas.schemas import CourseCreate, CourseOut, ChapterListItem, JoinCourseRequest
from app.routers.auth import get_current_user, require_teacher

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.post("", response_model=CourseOut)
@router.post("/", response_model=CourseOut)
def create_course(payload: CourseCreate, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    course = Course(title=payload.title, description=payload.description, owner_id=user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


# Fetch courses created by the logged-in teacher
@router.get("/teacher", response_model=list[CourseOut])
def get_teacher_courses(db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    courses = db.query(Course).filter(Course.owner_id == user.id).order_by(Course.created_at.desc()).all()
    return courses


# Student joins a course using unique 6-character code
@router.post("/join")
def join_course(payload: JoinCourseRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    clean_code = payload.code.strip().upper()
    course = db.query(Course).filter(Course.code == clean_code).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Invalid course code. Please check and try again.")

    # Check for existing enrollment
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == user.id,
        Enrollment.course_id == course.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course.")

    enrollment = Enrollment(student_id=user.id, course_id=course.id)
    db.add(enrollment)
    db.commit()
    return {"message": f"Successfully joined '{course.title}'"}


# Fetch courses enrolled by the logged-in student (with teacher names)
@router.get("/enrolled", response_model=list[CourseOut])
def get_enrolled_courses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == user.id).all()
    
    enrolled_courses = []
    for e in enrollments:
        course = db.query(Course).filter(Course.id == e.course_id).first()
        if course:
            teacher = db.query(User).filter(User.id == course.owner_id).first()
            course_data = CourseOut(
                id=course.id,
                title=course.title,
                description=course.description,
                code=course.code,
                teacher_name=teacher.name if teacher else "Instructor",
                created_at=course.created_at
            )
            enrolled_courses.append(course_data)

    return enrolled_courses


@router.get("", response_model=list[CourseOut])
@router.get("/", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Course).order_by(Course.created_at.desc()).all()


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    teacher = db.query(User).filter(User.id == course.owner_id).first()
    return CourseOut(
        id=course.id,
        title=course.title,
        description=course.description,
        code=course.code,
        teacher_name=teacher.name if teacher else "Instructor",
        created_at=course.created_at
    )


@router.get("/{course_id}/chapters", response_model=list[ChapterListItem])
def list_chapters(course_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Chapter)
        .filter(Chapter.course_id == course_id)
        .order_by(Chapter.order_index.asc())
        .all()
    )


@router.delete("/{course_id}")
def delete_course(course_id: str, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"ok": True}