import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine
from app.core.config import settings
from app.models import models  # noqa: F401 (ensures models are registered)
from app.routers import auth, courses, upload, chapters, chat, quiz, analytics, admin # 1. Import admin

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LMS Platform API",
    description="Document-to-web LMS with RAG chatbot, quiz generation, and analytics",
    version="1.0.0",
    redirect_slashes=False,
)

# Ensure the data/assets directory exists and mount static routes
os.makedirs("data/assets", exist_ok=True)
app.mount("/assets", StaticFiles(directory="data/assets"), name="assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(upload.router)
app.include_router(chapters.router)
app.include_router(chat.router)
app.include_router(quiz.router)
app.include_router(analytics.router)
app.include_router(admin.router, prefix="/api") # 2. Register admin router with /api prefix


@app.get("/api/health")
def health():
    return {"status": "ok", "llm_provider": settings.LLM_PROVIDER}