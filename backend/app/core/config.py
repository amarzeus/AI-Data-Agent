"""
Database configuration and settings
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = "sqlite:///./ai_data_agent.db?mode=wal"  # Force SQLite for testing with WAL mode for concurrency

# Create engine with better connection management for SQLite
from sqlalchemy.pool import StaticPool
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 20.0,  # Increase timeout for SQLite operations
    } if "sqlite" in DATABASE_URL else {},
    poolclass=StaticPool if "sqlite" in DATABASE_URL else None,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=False  # Set to True for debugging SQL
)

# Enable WAL mode for SQLite to handle concurrency
if "sqlite" in DATABASE_URL:
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL;"))
        conn.commit()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Database session dependency
def get_db():
    """Database session dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Application settings
class Settings:
    """Application settings"""

    # File upload settings
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    # AI settings
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    # Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-secret")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    TOKEN_ALGORITHM: str = os.getenv("TOKEN_ALGORITHM", "HS256")

    # API settings
    API_HOST: str = os.getenv("HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("PORT", "8000"))

    # CORS settings
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Global settings instance
settings = Settings()