import os
import sys
import pytest
from pathlib import Path
from typing import Generator

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.core.config import Base, get_db, engine as app_engine, SessionLocal

# Test database URL (in-memory SQLite for isolation)
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the get_db dependency to use test database
def override_get_db() -> Generator:
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Apply dependency override
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def engine():
    """Test database engine."""
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def db_session(engine):
    """Create a new database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client():
    """Create FastAPI TestClient."""
    yield TestClient(app)
    # Cleanup after each test
    app.dependency_overrides.clear()

@pytest.fixture
def mock_gemini(monkeypatch):
    """Mock Gemini service for tests."""
    def mock_execute(*args, **kwargs):
        return {
            "status": "completed",
            "query": "Show all data",
            "sql_query": "SELECT * FROM test_table",
            "executed_results": {"data": [], "columns": [], "row_count": 0},
            "visualizations": [],
            "explanation": "Test explanation"
        }

    # Mock the service instance
    mock_service = type('MockService', (), {
        'execute_ai_query': mock_execute
    })()

    monkeypatch.setattr("app.services.gemini_service.get_gemini_service", lambda: mock_service)
    return mock_service

# Additional fixtures can be added here for specific test needs
