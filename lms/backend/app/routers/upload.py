import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Chapter, Course, User
from app.schemas.schemas import ChapterOut
from app.routers.auth import require_teacher
from app.services.parser_docx import parse_docx
from app.services.parser_latex import parse_tex
from app.services import vector_store

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXT = {".docx", ".tex"}


@router.post("/chapter", response_model=ChapterOut)
async def upload_chapter(
    course_id: str = Form(...),
    title: str = Form(""),
    order_index: int = Form(0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Only .docx and .tex files are supported")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_name = f"{uuid.uuid4()}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_name)
    contents = await file.read()
    with open(saved_path, "wb") as f:
        f.write(contents)

    try:
        if ext == ".docx":
            parsed = parse_docx(saved_path)
            source_type = "docx"
        else:
            parsed = parse_tex(saved_path)
            source_type = "tex"
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {e}")

    chapter_title = title.strip() or (parsed["sections"][0]["heading"] if parsed["sections"] else file.filename)

    chapter = Chapter(
        course_id=course_id,
        title=chapter_title,
        order_index=order_index,
        source_filename=file.filename,
        source_type=source_type,
        html_content=parsed["html_content"],
        raw_text=parsed["raw_text"],
        sections_json=parsed["sections"],
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)

    # Build the RAG vector index for this chapter immediately
    vector_store.index_chapter(chapter.id, chapter.raw_text, chapter.sections_json)

    return chapter


@router.delete("/chapter/{chapter_id}")
def delete_chapter(chapter_id: str, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    vector_store.delete_chapter_index(chapter_id)
    db.delete(chapter)
    db.commit()
    return {"ok": True}
