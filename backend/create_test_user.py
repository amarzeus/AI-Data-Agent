"""Utility script to create or reset a local test user account."""

import os

from app.core.config import SessionLocal
from app.models import User
from app.models.schemas import UserCreate
from app.services.auth_service import auth_service


DEFAULT_EMAIL = os.getenv("TEST_USER_EMAIL", "tester@example.com")
DEFAULT_PASSWORD = os.getenv("TEST_USER_PASSWORD", "TestPassword123!")
DEFAULT_FULL_NAME = os.getenv("TEST_USER_FULL_NAME", "Test User")


def create_or_update_test_user() -> None:
    """Create the default test user if missing, otherwise reset the password."""
    db = SessionLocal()
    try:
        normalized_email = DEFAULT_EMAIL.lower()
        existing_user = db.query(User).filter(User.email == normalized_email).first()

        if existing_user:
            existing_user.hashed_password = auth_service.hash_password(DEFAULT_PASSWORD)
            existing_user.full_name = DEFAULT_FULL_NAME
            db.add(existing_user)
            db.commit()
            message = "Updated existing test user"
        else:
            payload = UserCreate(
                email=normalized_email,
                password=DEFAULT_PASSWORD,
                full_name=DEFAULT_FULL_NAME,
            )
            auth_service.create_user(db, payload)
            message = "Created test user"

        print(
            f"{message}: {normalized_email}\n"
            f"Password: {DEFAULT_PASSWORD}\n"
            "Use the values above to sign in to the dashboard."
        )
    finally:
        db.close()


if __name__ == "__main__":
    create_or_update_test_user()

