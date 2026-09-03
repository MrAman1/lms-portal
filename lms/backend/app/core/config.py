from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    LLM_PROVIDER: str = "gemini"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    DATABASE_URL: str = "sqlite:///./data/lms.db"

    CHROMA_PERSIST_DIR: str = "./data/chroma"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    UPLOAD_DIR: str = "./data/uploads"
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
