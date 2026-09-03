from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Chapter, Quiz, QuizAttempt, User
from app.schemas.schemas import (
    QuizGenerateRequest, QuizOut, QuizSubmitRequest, QuizAttemptOut, RevisionRequest, RevisionResponse
)
from app.routers.auth import get_current_user, require_teacher
from app.services import llm_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizOut)
def generate_quiz(payload: QuizGenerateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chapter = db.query(Chapter).filter(Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    if not chapter.raw_text.strip():
        raise HTTPException(status_code=422, detail="Chapter has no extractable text to build a quiz from")

    try:
        questions = llm_service.generate_quiz(chapter.raw_text, payload.num_questions)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Quiz generation failed: {e}")

    # basic validation / normalization
    clean_questions = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        options = q.get("options", [])
        if len(options) != 4:
            continue
        clean_questions.append({
            "question": q.get("question", "").strip(),
            "options": options,
            "correct_index": int(q.get("correct_index", 0)) % 4,
            "topic": q.get("topic", chapter.title),
        })

    if not clean_questions:
        raise HTTPException(status_code=502, detail="Model did not return usable questions; try again")

    quiz = Quiz(chapter_id=chapter.id, title=f"{chapter.title} Quiz", questions_json=clean_questions)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/chapter/{chapter_id}", response_model=list[QuizOut])
def list_quizzes(chapter_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Quiz).filter(Quiz.chapter_id == chapter_id).order_by(Quiz.created_at.desc()).all()


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.post("/submit", response_model=QuizAttemptOut)
def submit_quiz(payload: QuizSubmitRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz.questions_json
    correct_count = 0
    answers_out = []
    weak_topic_counter = Counter()

    for ans in payload.answers:
        if ans.q_index >= len(questions):
            continue
        q = questions[ans.q_index]
        is_correct = ans.selected_index == q["correct_index"]
        if is_correct:
            correct_count += 1
        else:
            weak_topic_counter[q.get("topic", "General")] += 1
        answers_out.append({
            "q_index": ans.q_index,
            "selected_index": ans.selected_index,
            "correct": is_correct,
        })

    total = len(questions)
    score_pct = round((correct_count / total) * 100, 1) if total else 0.0
    weak_topics = [{"topic": t, "miss_count": c} for t, c in weak_topic_counter.most_common()]

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=user.id,
        score=score_pct,
        total=total,
        answers_json=answers_out,
        weak_topics_json=weak_topics,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


@router.post("/revision-aids", response_model=RevisionResponse)
def revision_aids(payload: RevisionRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chapter = db.query(Chapter).filter(Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    if not chapter.raw_text.strip():
        raise HTTPException(status_code=422, detail="Chapter has no extractable text")

    try:
        result = llm_service.generate_revision_aids(chapter.raw_text)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Revision aid generation failed: {e}")

    return RevisionResponse(
        comparison_table_markdown=result.get("comparison_table_markdown", ""),
        mnemonics=result.get("mnemonics", []),
        mermaid_mindmap=result.get("mermaid_mindmap", "mindmap\n  root((" + chapter.title + "))"),
    )
