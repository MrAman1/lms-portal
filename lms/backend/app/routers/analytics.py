from collections import Counter, defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Course, Chapter, Progress, QuizAttempt, Quiz, User, UserRole
from app.schemas.schemas import TeacherAnalyticsOut, StudentProgressOut, WeakTopicOut
from app.routers.auth import get_current_user, require_teacher

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/student/me")
def student_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    progress_rows = db.query(Progress).filter(Progress.student_id == user.id).all()
    attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == user.id).all()

    chapters_progress = [
        {
            "chapter_id": p.chapter_id,
            "completion_pct": p.completion_pct,
            "last_viewed_at": p.last_viewed_at,
        }
        for p in progress_rows
    ]
    quiz_history = [
        {"quiz_id": a.quiz_id, "score": a.score, "total": a.total, "submitted_at": a.submitted_at}
        for a in attempts
    ]
    avg_score = round(sum(a.score for a in attempts) / len(attempts), 1) if attempts else 0.0

    return {
        "chapters_progress": chapters_progress,
        "quiz_history": quiz_history,
        "avg_quiz_score": avg_score,
        "chapters_completed": sum(1 for p in progress_rows if p.completion_pct >= 95),
    }


@router.get("/teacher/course/{course_id}", response_model=TeacherAnalyticsOut)
def teacher_dashboard(course_id: str, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    chapters = db.query(Chapter).filter(Chapter.course_id == course_id).all()
    chapter_ids = [c.id for c in chapters]
    total_chapters = len(chapters)

    students = db.query(User).filter(User.role == UserRole.STUDENT).all()

    student_progress_out = []
    completion_pcts = []

    quiz_ids = [q.id for q in db.query(Quiz).filter(Quiz.chapter_id.in_(chapter_ids)).all()] if chapter_ids else []

    weak_topic_counter = Counter()

    for student in students:
        prog_rows = (
            db.query(Progress)
            .filter(Progress.student_id == student.id, Progress.chapter_id.in_(chapter_ids))
            .all()
            if chapter_ids
            else []
        )
        completed = sum(1 for p in prog_rows if p.completion_pct >= 95)
        pct = round((completed / total_chapters) * 100, 1) if total_chapters else 0.0

        attempts = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.student_id == student.id, QuizAttempt.quiz_id.in_(quiz_ids))
            .all()
            if quiz_ids
            else []
        )
        avg_quiz = round(sum(a.score for a in attempts) / len(attempts), 1) if attempts else 0.0

        for a in attempts:
            for wt in a.weak_topics_json or []:
                weak_topic_counter[wt["topic"]] += wt["miss_count"]

        if prog_rows or attempts:
            completion_pcts.append(pct)
            student_progress_out.append(
                StudentProgressOut(
                    student_id=student.id,
                    student_name=student.name,
                    chapters_completed=completed,
                    total_chapters=total_chapters,
                    avg_quiz_score=avg_quiz,
                )
            )

    avg_completion = round(sum(completion_pcts) / len(completion_pcts), 1) if completion_pcts else 0.0
    weak_topics_out = [
        WeakTopicOut(topic=t, miss_count=c) for t, c in weak_topic_counter.most_common(10)
    ]

    return TeacherAnalyticsOut(
        course_id=course_id,
        total_students=len(student_progress_out),
        avg_completion_pct=avg_completion,
        student_progress=student_progress_out,
        class_weak_topics=weak_topics_out,
    )
