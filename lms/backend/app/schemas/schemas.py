from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"  # student | teacher


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Course / Chapter ----------
class CourseCreate(BaseModel):
    title: str
    description: str = ""


class JoinCourseRequest(BaseModel):
    code: str


class CourseOut(BaseModel):
    id: str
    title: str
    description: str
    code: Optional[str] = None
    teacher_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChapterOut(BaseModel):
    id: str
    course_id: str
    title: str
    order_index: int
    source_filename: str
    source_type: str
    html_content: str
    sections_json: List[Any]
    created_at: datetime

    class Config:
        from_attributes = True


class ChapterListItem(BaseModel):
    id: str
    title: str
    order_index: int
    source_type: str

    class Config:
        from_attributes = True


# ---------- Chat / RAG ----------
class ChatRequest(BaseModel):
    chapter_id: str
    question: str


class ChatResponse(BaseModel):
    answer: str
    grounded: bool
    sources: List[str] = []


# ---------- Quiz ----------
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    topic: str = ""


class QuizGenerateRequest(BaseModel):
    chapter_id: str
    num_questions: int = 5


class QuizOut(BaseModel):
    id: str
    chapter_id: str
    title: str
    questions_json: List[Any]

    class Config:
        from_attributes = True


class QuizSubmitAnswer(BaseModel):
    q_index: int
    selected_index: int


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[QuizSubmitAnswer]


class QuizAttemptOut(BaseModel):
    id: str
    score: float
    total: int
    weak_topics_json: List[Any]

    class Config:
        from_attributes = True


# ---------- Revision aids ----------
class RevisionRequest(BaseModel):
    chapter_id: str


class RevisionResponse(BaseModel):
    comparison_table_markdown: str
    mnemonics: List[str]
    mermaid_mindmap: str


# ---------- Analytics ----------
class StudentProgressOut(BaseModel):
    student_id: str
    student_name: str
    chapters_completed: int
    total_chapters: int
    avg_quiz_score: float


class WeakTopicOut(BaseModel):
    topic: str
    miss_count: int


class TeacherAnalyticsOut(BaseModel):
    course_id: str
    total_students: int
    avg_completion_pct: float
    student_progress: List[StudentProgressOut]
    class_weak_topics: List[WeakTopicOut]