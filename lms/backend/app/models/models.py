import enum
import secrets
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum, Boolean, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def gen_id() -> str:
    """Generates a unique string UUID for database primary keys."""
    return str(uuid.uuid4())


def generate_course_code() -> str:
    """Generates a unique 6-character hex code for student course joining."""
    return secrets.token_hex(3).upper()


class UserRole(str, enum.Enum):
    """
    Enum representing user access levels across the application.
    Added 'ADMIN' role to manage teacher account approvals.
    """
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    """
    Database model representing system users.
    Includes 'is_approved' to support pending approval status for teachers.
    """
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    
    # Track account approval: Defaults to True for students/admin, False for new teacher requests
    is_approved = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    courses = relationship("Course", back_populates="owner")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="student")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")


class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    code = Column(String, unique=True, index=True, default=generate_course_code, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")


class Enrollment(Base):
    """
    Junction table linking students to courses they joined using a course code.
    """
    __tablename__ = "enrollments"
    id = Column(String, primary_key=True, default=gen_id)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(String, primary_key=True, default=gen_id)
    course_id = Column(String, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    order_index = Column(Integer, default=0)
    source_filename = Column(String, default="")
    source_type = Column(String, default="docx")  # docx | tex
    html_content = Column(Text, default="")        # rendered structured HTML (with $$ katex $$ blocks preserved)
    raw_text = Column(Text, default="")             # plain text used for RAG chunking
    sections_json = Column(JSON, default=list)       # [{heading, level, content}]
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="chapters")


class Progress(Base):
    __tablename__ = "progress"
    id = Column(String, primary_key=True, default=gen_id)
    student_id = Column(String, ForeignKey("users.id"))
    chapter_id = Column(String, ForeignKey("chapters.id"))
    completion_pct = Column(Float, default=0.0)
    last_viewed_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="progress")


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(String, primary_key=True, default=gen_id)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    title = Column(String, default="Chapter Quiz")
    questions_json = Column(JSON, default=list)  # [{question, options[4], correct_index, topic}]
    created_at = Column(DateTime, default=datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(String, primary_key=True, default=gen_id)
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    student_id = Column(String, ForeignKey("users.id"))
    score = Column(Float, default=0.0)
    total = Column(Integer, default=0)
    answers_json = Column(JSON, default=list)   # [{q_index, selected_index, correct}]
    weak_topics_json = Column(JSON, default=list)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="quiz_attempts")


class ChatLog(Base):
    __tablename__ = "chat_logs"
    id = Column(String, primary_key=True, default=gen_id)
    student_id = Column(String, ForeignKey("users.id"))
    chapter_id = Column(String, ForeignKey("chapters.id"))
    question = Column(Text)
    answer = Column(Text)
    grounded = Column(Boolean, default=True)  # False if model had to say "not in notes"
    created_at = Column(DateTime, default=datetime.utcnow)