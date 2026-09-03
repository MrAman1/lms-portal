from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Chapter, ChatLog, User
from app.schemas.schemas import ChatRequest, ChatResponse
from app.routers.auth import get_current_user
from app.services import vector_store, llm_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chapter = db.query(Chapter).filter(Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    hits = vector_store.query_chapter(payload.chapter_id, payload.question, top_k=4)

    if not hits:
        return ChatResponse(
            answer="I couldn't find that in this chapter's notes.",
            grounded=False,
            sources=[],
        )

    try:
        result = llm_service.answer_from_context(payload.question, hits)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM generation failed: {e}")

    log = ChatLog(
        student_id=user.id,
        chapter_id=payload.chapter_id,
        question=payload.question,
        answer=result["answer"],
        grounded=result["grounded"],
    )
    db.add(log)
    db.commit()

    sources = sorted({h["heading"] for h in hits if h["heading"]})
    return ChatResponse(answer=result["answer"], grounded=result["grounded"], sources=sources)
