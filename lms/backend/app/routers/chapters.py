from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.models import Chapter, Progress, User
from app.schemas.schemas import ChapterOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/chapters", tags=["chapters"])


@router.get("/{chapter_id}", response_model=ChapterOut)
def get_chapter(chapter_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


@router.post("/{chapter_id}/progress")
def update_progress(
    chapter_id: str,
    completion_pct: float,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    progress = (
        db.query(Progress)
        .filter(Progress.student_id == user.id, Progress.chapter_id == chapter_id)
        .first()
    )
    if not progress:
        progress = Progress(student_id=user.id, chapter_id=chapter_id, completion_pct=0.0)
        db.add(progress)

    progress.completion_pct = max(progress.completion_pct, min(completion_pct, 100.0))
    progress.last_viewed_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "completion_pct": progress.completion_pct}
