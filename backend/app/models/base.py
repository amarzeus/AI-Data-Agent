"""
Base database models for the AI Data Agent
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.config import Base

class UploadedFile(Base):
    """Model for tracking uploaded Excel files"""

    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_hash = Column(String(64), nullable=False)  # For duplicate detection
    mime_type = Column(String(100), nullable=False)

    # File processing status
    status = Column(String(50), default="uploaded")  # uploaded, processing, completed, failed
    error_message = Column(Text, nullable=True)

    # Metadata
    total_sheets = Column(Integer, default=0)
    total_rows = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Processing info
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_time_seconds = Column(Float, nullable=True)

    # Dynamic table and cleaning info
    dynamic_table_name = Column(String(255), nullable=True)
    sheet_names = Column(JSON, nullable=True)  # List of sheet names as JSON array
    cleaning_metadata = Column(JSON, nullable=True)  # Per-sheet cleaning info

    chat_sessions = relationship(
        "ChatSession",
        back_populates="file",
        cascade="all, delete-orphan",
    )

class FileSheet(Base):
    """Model for tracking individual sheets within uploaded files"""

    __tablename__ = "file_sheets"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, nullable=False, index=True)

    # Sheet information
    sheet_name = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False, unique=True)  # Auto-generated table name

    # Sheet metadata
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    header_row = Column(Integer, default=0)  # Row number containing headers

    # Data quality
    has_headers = Column(Boolean, default=True)
    data_quality_score = Column(Float, nullable=True)  # 0-100 quality score

    # Status
    status = Column(String(50), default="pending")  # pending, processing, completed, failed

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

class SheetColumn(Base):
    """Model for tracking column metadata and data types"""

    __tablename__ = "sheet_columns"

    id = Column(Integer, primary_key=True, index=True)
    sheet_id = Column(Integer, nullable=False, index=True)
    file_id = Column(Integer, nullable=False, index=True)

    # Column information
    column_name = Column(String(255), nullable=False)
    original_column_name = Column(String(255), nullable=True)  # Before cleaning
    column_index = Column(Integer, nullable=False)  # Position in sheet

    # Data type detection
    detected_data_type = Column(String(50), nullable=False)  # string, integer, float, date, boolean
    confidence_score = Column(Float, nullable=True)  # How confident we are in the data type

    # Data characteristics
    is_nullable = Column(Boolean, default=True)
    unique_values_count = Column(Integer, default=0)
    null_values_count = Column(Integer, default=0)

    # String-specific metadata
    max_length = Column(Integer, nullable=True)
    avg_length = Column(Float, nullable=True)

    # Numeric-specific metadata
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    avg_value = Column(Float, nullable=True)
    std_deviation = Column(Float, nullable=True)

    # Date-specific metadata
    earliest_date = Column(DateTime(timezone=True), nullable=True)
    latest_date = Column(DateTime(timezone=True), nullable=True)

    # Data quality flags
    has_inconsistent_types = Column(Boolean, default=False)
    has_outliers = Column(Boolean, default=False)
    needs_cleaning = Column(Boolean, default=False)

    # Processing
    cleaning_applied = Column(JSON, nullable=True)  # Track what cleaning was done

class DataQualityIssue(Base):
    """Model for tracking data quality issues"""

    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, nullable=False, index=True)
    sheet_id = Column(Integer, nullable=True, index=True)
    column_id = Column(Integer, nullable=True, index=True)

    # Issue details
    issue_type = Column(String(100), nullable=False)  # missing_values, inconsistent_types, outliers, etc.
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    description = Column(Text, nullable=False)

    # Location
    row_number = Column(Integer, nullable=True)
    column_name = Column(String(255), nullable=True)

    # Resolution
    resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

class QueryHistory(Base):
    """Model for tracking user queries and responses"""

    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True, index=True)

    # Query details
    natural_language_query = Column(Text, nullable=False)
    processed_query = Column(Text, nullable=True)  # AI-processed version
    sql_query = Column(Text, nullable=True)  # Generated SQL

    # Response
    response_text = Column(Text, nullable=True)
    visualization_type = Column(String(50), nullable=True)  # chart, table, pivot
    visualization_config = Column(JSON, nullable=True)

    # Metadata
    execution_time_ms = Column(Float, nullable=True)
    rows_returned = Column(Integer, nullable=True)
    status = Column(String(50), default="completed")  # completed, failed, timeout

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    executed_at = Column(DateTime(timezone=True), nullable=True)

    session = relationship("ChatSession", back_populates="query_history")











class ChatSession(Base):
    """Persistent AI chat sessions for users"""

    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False, default="New conversation")
    summary = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_interaction_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    file = relationship("UploadedFile", back_populates="chat_sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        order_by="ChatMessage.created_at",
        cascade="all, delete-orphan",
    )
    query_history = relationship("QueryHistory", back_populates="session")


class ChatMessage(Base):
    """Messages exchanged within a chat session"""

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")
