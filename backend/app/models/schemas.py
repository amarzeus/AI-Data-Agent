"""
Pydantic schemas for API request/response validation
"""

from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class DataType(str, Enum):
    """Data type enumeration"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"

class FileStatus(str, Enum):
    """File processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Severity(str, Enum):
    """Issue severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class QueryStatus(str, Enum):
    """Query execution status"""
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"

# File Upload Schemas
class FileUploadResponse(BaseModel):
    """Response schema for file upload"""
    message: str
    filename: str
    size: int
    file_path: str
    file_id: Optional[int] = None

class FileProcessingStatus(BaseModel):
    """Schema for file processing status"""
    file_id: int
    status: FileStatus
    progress: float = Field(ge=0, le=100)
    message: Optional[str] = None
    error_message: Optional[str] = None

# Sheet Schemas
class SheetInfo(BaseModel):
    """Schema for sheet information"""
    sheet_id: int
    sheet_name: str
    table_name: str
    row_count: int
    column_count: int
    has_headers: bool
    data_quality_score: Optional[float] = None
    status: str

class SheetListResponse(BaseModel):
    """Response schema for listing sheets in a file"""
    file_id: int
    filename: str
    sheets: List[SheetInfo]

# Column Schemas
class ColumnInfo(BaseModel):
    """Schema for column information"""
    column_id: int
    column_name: str
    original_column_name: Optional[str]
    column_index: int
    detected_data_type: DataType
    confidence_score: Optional[float]
    is_nullable: bool
    unique_values_count: int
    null_values_count: int
    max_length: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    has_inconsistent_types: bool = False
    needs_cleaning: bool = False

class ColumnListResponse(BaseModel):
    """Response schema for listing columns in a sheet"""
    sheet_id: int
    sheet_name: str
    columns: List[ColumnInfo]

# Data Quality Schemas
class DataQualityIssueSchema(BaseModel):
    """Schema for data quality issues"""
    issue_id: int
    issue_type: str
    severity: Severity
    description: str
    row_number: Optional[int]
    column_name: Optional[str]
    resolved: bool = False

class DataQualityReport(BaseModel):
    """Schema for data quality report"""
    file_id: int
    sheet_id: int
    total_issues: int
    issues_by_severity: Dict[Severity, int]
    issues_by_type: Dict[str, int]
    overall_quality_score: float
    issues: List[DataQualityIssueSchema]

# Query Schemas
class NaturalLanguageQuery(BaseModel):
    """Schema for natural language query"""
    query: str = Field(..., min_length=1, max_length=1000)
    file_id: Optional[int] = None
    include_visualization: bool = True

class QueryResponse(BaseModel):
    """Schema for query response"""
    query_id: int
    original_query: str
    processed_query: Optional[str]
    sql_query: Optional[str]
    response_text: str
    visualization_type: Optional[str]
    visualization_data: Optional[Dict[str, Any]]
    execution_time_ms: float
    rows_returned: Optional[int]
    status: QueryStatus

class QueryHistoryItem(BaseModel):
    """Schema for query history item"""
    query_id: int
    query: str
    response: str
    created_at: datetime
    execution_time_ms: float

# Data Preview Schemas
class DataPreviewRequest(BaseModel):
    """Schema for data preview request"""
    sheet_id: int
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)

class DataPreviewResponse(BaseModel):
    """Schema for data preview response"""
    sheet_id: int
    total_rows: int
    preview_rows: int
    columns: List[str]
    data: List[Dict[str, Any]]

# Visualization Schemas
class ChartType(str, Enum):
    """Chart type enumeration"""
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    SCATTER = "scatter"
    AREA = "area"
    HISTOGRAM = "histogram"

class VisualizationRequest(BaseModel):
    """Schema for visualization request"""
    chart_type: ChartType
    x_column: str
    y_column: Optional[str] = None
    aggregation: Optional[str] = None  # sum, avg, count, etc.
    group_by: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

class VisualizationResponse(BaseModel):
    """Schema for visualization response"""
    chart_type: ChartType
    title: str
    data: Dict[str, Any]
    config: Dict[str, Any]

# Error Schemas
class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None

# Dynamic Schema Models
class DynamicColumnSchema(BaseModel):
    """Schema for dynamic table column"""
    name: str
    type: str  # SQL type: TEXT, INTEGER, FLOAT, DATE
    nullable: bool = True
    primary_key: Optional[bool] = False
    constraints: Optional[List[str]] = []

class DynamicTableSchema(BaseModel):
    """Schema for dynamic table creation"""
    table_name: str
    columns: List[DynamicColumnSchema]

class CleanedDataMetadata(BaseModel):
    """Metadata about data cleaning operations"""
    original_row_count: int
    cleaned_row_count: int
    issues: List[str]
    cleaning_steps: List[str]
    rows_removed: int
    cleaned_at: datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    job_title: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    job_title: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

# AI Query Models
class AIQueryRequest(BaseModel):
    """Request schema for AI-powered queries"""
    query: str = Field(..., min_length=1)
    file_id: Optional[int] = None
    context: Optional[str] = None
    session_id: Optional[int] = None
    session_title: Optional[str] = None

class AIQueryResponse(BaseModel):
    """Response schema for AI query execution"""
    status: str
    query: str
    sql_query: Optional[str] = None
    executed_results: Optional[Dict[str, Any]] = None
    visualizations: Optional[List[Dict[str, Any]]] = Field(None, max_items=3)
    explanation: Optional[str] = None
    data_quality_disclaimer: Optional[str] = None
    error: Optional[str] = None
    session_id: Optional[int] = None
    session_title: Optional[str] = None
    created_session: Optional[ChatSessionSummary] = None
    messages: Optional[List[ChatMessageResponse]] = None


# Chat Schemas
class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    file_id: Optional[int] = None


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    is_archived: Optional[bool] = None
    file_id: Optional[int] = None


class ChatMessageCreate(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1)
    sql_query: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    user_id: Optional[int]
    role: str
    content: str
    sql_query: Optional[str]
    payload: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionSummary(BaseModel):
    id: int
    title: str
    summary: Optional[str]
    file_id: Optional[int]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    last_interaction_at: Optional[datetime]
    message_count: int
    assistant_preview: Optional[str]


class ChatSessionResponse(BaseModel):
    session: ChatSessionSummary


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionSummary]


class ChatMessageListResponse(BaseModel):
    session_id: int
    messages: List[ChatMessageResponse]
    session_id: Optional[int] = None

# Health Check Schema
class HealthCheckResponse(BaseModel):
    """Schema for health check response"""
    status: str
    database: str
    timestamp: datetime
    version: str
