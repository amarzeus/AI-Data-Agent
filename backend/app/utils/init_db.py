"""
Database initialization script
"""

from ..core.config import Base, engine
from ..models.base import (
    UploadedFile, FileSheet, SheetColumn,
    DataQualityIssue, QueryHistory
)
from .database import table_manager

def create_tables():
    """Create all database tables"""
    try:
        # Create base tables
        Base.metadata.create_all(bind=engine)

        # Create any additional dynamic table infrastructure if needed
        table_manager.create_tables()

        print("✅ Database tables created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        return False

def drop_tables():
    """Drop all database tables (for development/testing)"""
    try:
        # Drop base tables
        Base.metadata.drop_all(bind=engine)

        print("✅ Database tables dropped successfully!")
        return True

    except Exception as e:
        print(f"❌ Error dropping database tables: {e}")
        return False

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "drop":
        drop_tables()
    else:
        create_tables()