"""
AI Data Agent Backend API
FastAPI application for Excel ingest, dynamic SQL generation, and AI-assisted analytics.
"""

import hashlib
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from dotenv import load_dotenv

from app.core.config import engine, get_db, settings
from app.models.base import (
    UploadedFile as UploadedFileModel,
    FileSheet,
    SheetColumn,
    DataQualityIssue,
    QueryHistory,
    ChatSession,
    ChatMessage,
    User,
)
from app.models.schemas import AIQueryRequest, ChatMessageResponse, ChatSessionSummary
from app.routers.ai import router as ai_router
from app.routers.auth import router as auth_router, get_current_user
from app.routers.chat import router as chat_router
from app.services import chat_service
from app.services.excel_processor import excel_processor
from app.services.gemini_service import get_gemini_service
from app.utils.database import (
    create_dynamic_table_from_schema,
    execute_sql,
    get_table_schema,
    insert_dataframe_to_table,
)
from app.utils.init_db import create_tables

# Load environment and initialize DB metadata
load_dotenv()
create_tables()

# --------------------------------------------------------------------------- #
# FastAPI application setup
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="AI Data Agent API",
    description="Backend service for Excel ingestion, AI-driven analytics, and visualization payloads.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: tighten once deployment origins known
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep existing routers for backwards compatibility
app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(chat_router)

# --------------------------------------------------------------------------- #
# Utility helpers
# --------------------------------------------------------------------------- #


def _ensure_excel_extension(filename: str) -> None:
    """Validate that a filename has an Excel extension."""
    if not filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Only Excel files (.xlsx, .xls) are allowed.",
        )


def _calculate_file_hash(content: bytes) -> str:
    """Return a SHA-256 hash for duplicate detection."""
    hasher = hashlib.sha256()
    hasher.update(content)
    return hasher.hexdigest()


def _resolve_primary_sheet(file_record: UploadedFileModel, db: Session) -> Tuple[FileSheet, str]:
    """Resolve the primary sheet for a file, return FileSheet and table name."""
    primary_sheet: Optional[str] = (file_record.sheet_names or [None])[0]
    sheet_query = db.query(FileSheet).filter(FileSheet.file_id == file_record.id)

    if primary_sheet:
        sheet_obj = sheet_query.filter(FileSheet.sheet_name == primary_sheet).first()
    else:
        sheet_obj = sheet_query.order_by(FileSheet.id).first()

    if not sheet_obj:
        raise HTTPException(status_code=400, detail="No sheet metadata found for file.")

    return sheet_obj, sheet_obj.table_name


def _serialize_sheet(sheet: FileSheet) -> Dict[str, Any]:
    """Serialize a FileSheet ORM model into response payload."""
    return {
        "sheet_id": sheet.id,
        "sheet_name": sheet.sheet_name,
        "table_name": sheet.table_name,
        "row_count": sheet.row_count,
        "column_count": sheet.column_count,
        "has_headers": sheet.has_headers,
        "data_quality_score": sheet.data_quality_score,
        "status": sheet.status,
        "processed_at": sheet.processed_at.isoformat() if sheet.processed_at else None,
    }


def _serialize_column(column: SheetColumn) -> Dict[str, Any]:
    """Serialize a SheetColumn ORM model into response payload."""
    return {
        "column_id": column.id,
        "sheet_id": column.sheet_id,
        "file_id": column.file_id,
        "column_name": column.column_name,
        "original_column_name": column.original_column_name,
        "column_index": column.column_index,
        "detected_data_type": column.detected_data_type,
        "confidence_score": column.confidence_score,
        "is_nullable": column.is_nullable,
        "unique_values_count": column.unique_values_count,
        "null_values_count": column.null_values_count,
        "max_length": column.max_length,
        "avg_length": column.avg_length,
        "min_value": column.min_value,
        "max_value": column.max_value,
        "avg_value": column.avg_value,
        "std_deviation": column.std_deviation,
        "earliest_date": column.earliest_date.isoformat() if column.earliest_date else None,
        "latest_date": column.latest_date.isoformat() if column.latest_date else None,
        "has_inconsistent_types": column.has_inconsistent_types,
        "has_outliers": column.has_outliers,
        "needs_cleaning": column.needs_cleaning,
        "cleaning_applied": column.cleaning_applied,
    }


def _fetch_table_preview(
    file_id: int,
    table_name: str,
    rows: int = 10,
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Fetch a preview from a dynamic table, returning (columns, data rows).
    Filters rows by file_id to prevent cross-file contamination.
    """
    preview_query = text(
        f"""
        SELECT *
        FROM "{table_name}"
        WHERE file_id = :file_id
        ORDER BY row_index
        LIMIT :limit
        """
    )

    with engine.connect() as connection:
        result = connection.execute(preview_query, {"file_id": file_id, "limit": rows})
        mappings = result.mappings().all()

    if not mappings:
        return [], []

    columns = [
        key
        for key in mappings[0].keys()
        if key not in {"id", "file_id", "row_index", "created_at", "updated_at"}
    ]

    data: List[Dict[str, Any]] = []
    for row in mappings:
        data.append({column: row[column] for column in columns})

    return columns, data


def _persist_sheet_columns(
    db: Session,
    file_id: int,
    sheet_id: int,
    column_analysis: Dict[str, Any],
) -> None:
    """Persist column profiling information into sheet_columns table."""
    for _, metadata in column_analysis.items():
        sheet_column = SheetColumn(
            sheet_id=sheet_id,
            file_id=file_id,
            column_name=metadata.get("sanitized_name"),
            original_column_name=metadata.get("display_name"),
            column_index=metadata.get("column_index", 0),
            detected_data_type=metadata.get("dtype"),
            confidence_score=metadata.get("confidence", None),
            is_nullable=metadata.get("is_nullable", True),
            unique_values_count=metadata.get("unique_count", 0),
            null_values_count=metadata.get("null_count", 0),
            max_length=metadata.get("max_length"),
            avg_length=metadata.get("avg_length"),
            min_value=metadata.get("min"),
            max_value=metadata.get("max"),
            avg_value=metadata.get("mean"),
            std_deviation=metadata.get("std"),
            earliest_date=None,
            latest_date=None,
            has_inconsistent_types=metadata.get("has_inconsistent_types", False),
            has_outliers=metadata.get("has_outliers", False),
            needs_cleaning=metadata.get("needs_cleaning", False),
            cleaning_applied=metadata.get("cleaning_steps"),
        )
        db.add(sheet_column)


def _persist_data_quality_issues(
    db: Session,
    file_id: int,
    sheet_id: int,
    issues: Optional[List[str]],
) -> None:
    """Store data quality issues as individual records."""
    if not issues:
        return

    for issue in issues:
        db.add(
            DataQualityIssue(
                file_id=file_id,
                sheet_id=sheet_id,
                issue_type="data_quality",
                severity="medium",
                description=issue,
                resolved=False,
            )
        )


def _prepare_sheet_columns(
    file_id: int,
    sheet_id: int,
    column_analysis: Dict[str, Any],
    sheet_name: str = None,
) -> List[SheetColumn]:
    """Prepare sheet column objects for batch insertion."""
    columns = []
    for _, metadata in column_analysis.items():
        sheet_column = SheetColumn(
            sheet_id=sheet_id,
            file_id=file_id,
            column_name=metadata.get("sanitized_name"),
            original_column_name=metadata.get("display_name"),
            column_index=metadata.get("column_index", 0),
            detected_data_type=metadata.get("dtype"),
            confidence_score=metadata.get("confidence", None),
            is_nullable=metadata.get("is_nullable", True),
            unique_values_count=metadata.get("unique_count", 0),
            null_values_count=metadata.get("null_count", 0),
            max_length=metadata.get("max_length"),
            avg_length=metadata.get("avg_length"),
            min_value=metadata.get("min"),
            max_value=metadata.get("max"),
            avg_value=metadata.get("mean"),
            std_deviation=metadata.get("std"),
            earliest_date=None,
            latest_date=None,
            has_inconsistent_types=metadata.get("has_inconsistent_types", False),
            has_outliers=metadata.get("has_outliers", False),
            needs_cleaning=metadata.get("needs_cleaning", False),
            cleaning_applied=metadata.get("cleaning_steps"),
        )
        # Store sheet_name for later mapping
        sheet_column.sheet_name = sheet_name
        columns.append(sheet_column)
    return columns


def _prepare_data_quality_issues(
    file_id: int,
    sheet_id: int,
    issues: Optional[List[str]],
    sheet_name: str = None,
) -> List[DataQualityIssue]:
    """Prepare data quality issue objects for batch insertion."""
    if not issues:
        return []

    quality_issues = []
    for issue in issues:
        quality_issue = DataQualityIssue(
            file_id=file_id,
            sheet_id=sheet_id,
            issue_type="data_quality",
            severity="medium",
            description=issue,
            resolved=False,
        )
        # Store sheet_name for later mapping
        quality_issue.sheet_name = sheet_name
        quality_issues.append(quality_issue)
    return quality_issues


# --------------------------------------------------------------------------- #
# API Endpoints
# --------------------------------------------------------------------------- #


@app.get("/", response_model=Dict[str, Any])
async def root() -> Dict[str, Any]:
    """Root endpoint for quick health inspection."""
    return {
        "message": "AI Data Agent Backend",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/upload/avatar", response_model=Dict[str, Any])
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Upload and store a user avatar image.

    - Validates the file is an image.
    - Stores the image in the avatars directory.
    - Updates the user's profile with the avatar URL.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image.",
        )

    # Validate file size (max 5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 5MB.",
        )

    # Create avatars directory if it doesn't exist
    avatars_dir = "avatars"
    os.makedirs(avatars_dir, exist_ok=True)

    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    if not file_extension:
        file_extension = ".jpg"  # Default extension

    unique_filename = f"{current_user.id}_{timestamp}{file_extension}"
    file_path = os.path.join(avatars_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as output_file:
        output_file.write(content)

    # Generate avatar URL (relative to static files)
    avatar_url = f"/avatars/{unique_filename}"

    # Update user profile
    if not current_user.profile:
        from app.models.base import UserProfile
        profile = UserProfile(user_id=current_user.id, avatar_url=avatar_url)
        db.add(profile)
    else:
        current_user.profile.avatar_url = avatar_url
        db.add(current_user.profile)

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Avatar uploaded successfully.",
        "avatar_url": avatar_url,
        "filename": unique_filename,
        "size": len(content),
    }


@app.get("/avatars/{filename}")
async def get_avatar(filename: str):
    """
    Serve uploaded avatar images.
    """
    avatars_dir = "avatars"
    file_path = os.path.join(avatars_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Avatar not found")

    from fastapi.responses import FileResponse
    return FileResponse(file_path)


@app.post("/upload", response_model=Dict[str, Any])
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Upload and process an Excel workbook.

    - Validates the file.
    - Cleans every sheet using the data_cleaner service.
    - Creates dynamic SQL tables (one per sheet) and inserts sanitized data.
    - Persists metadata for sheets, columns, and data quality.
    """
    _ensure_excel_extension(file.filename)

    uploads_dir = settings.UPLOAD_DIR or "uploads"
    os.makedirs(uploads_dir, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(uploads_dir, unique_filename)

    try:
        content = await file.read()
        with open(file_path, "wb") as output_file:
            output_file.write(content)

        file_hash = _calculate_file_hash(content)

        validation_result = excel_processor.validate_excel_file(file_path)
        if not validation_result.get("is_valid", False):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid Excel file: {validation_result.get('error', 'Unknown error')}",
            )

        processing_started = datetime.utcnow()
        processed_payload = excel_processor.process_excel_file(file_path)
        processing_completed = datetime.utcnow()

        if processed_payload.get("status") != "success":
            raise HTTPException(
                status_code=500,
                detail=f"Processing failed: {processed_payload.get('error', 'Unknown error')}",
            )

        primary_sheet_key = processed_payload.get("primary_sheet")
        processed_sheets = processed_payload.get("processed_sheets", {})
        sheet_names = processed_payload.get("sheet_names", [])
        total_rows = processed_payload.get("total_rows", 0)

        if not processed_sheets:
            raise HTTPException(status_code=400, detail="No sheets were discovered in the workbook.")

        # Prepare UploadedFile ORM record
        uploaded_file = UploadedFileModel(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            file_hash=file_hash,
            mime_type=file.content_type or "application/vnd.ms-excel",
            status="completed",
            error_message=None,
            total_sheets=len(sheet_names),
            total_rows=total_rows,
            total_columns=processed_payload.get("dataframe_info", {}).get("shape", [0, 0])[1]
            if processed_payload.get("dataframe_info")
            else 0,
            processed_at=processing_completed,
            processing_time_seconds=(processing_completed - processing_started).total_seconds(),
            dynamic_table_name=None,
            sheet_names=sheet_names,
            cleaning_metadata=processed_payload.get("cleaning_metadata"),
        )

        # First, add and commit the uploaded file to get the ID
        db.add(uploaded_file)
        db.flush()  # This assigns an ID to uploaded_file without committing the transaction

        # Prepare all data before starting database operations
        sheet_summaries: List[Dict[str, Any]] = []
        sheet_models = []
        sheet_columns_to_add = []
        quality_issues_to_add = []
        sheet_id_mapping = {}  # Keep track of sheet names to IDs

        for index, (sheet_name, details) in enumerate(processed_sheets.items()):
            schema = details["schema"]
            sanitized_df = details["sanitized_dataframe"]

            # Generate unique table name using file_id to avoid schema conflicts
            unique_table_name = f"file_{uploaded_file.id}_sheet_{index}_{schema['base_table_name']}"
            schema['table_name'] = unique_table_name

            # Create dynamic table and insert cleaned data (these operations have their own retry logic)
            table_name = create_dynamic_table_from_schema(schema, engine)
            insert_dataframe_to_table(
                sanitized_df,
                table_name,
                engine,
                file_id=uploaded_file.id,
            )

            sheet_model = FileSheet(
                file_id=uploaded_file.id,
                sheet_name=sheet_name,
                table_name=table_name,
                row_count=details["dataframe_info"]["shape"][0],
                column_count=details["dataframe_info"]["shape"][1],
                has_headers=True,
                data_quality_score=details["cleaning_metadata"].get("quality_score"),
                status="completed",
                processed_at=processing_completed,
                header_row=0,
            )

            sheet_models.append(sheet_model)

            # Collect columns and issues to add in batch - we'll set sheet_id after flush
            columns_for_sheet = _prepare_sheet_columns(uploaded_file.id, None, details["column_analysis"], sheet_name)
            issues_for_sheet = _prepare_data_quality_issues(
                uploaded_file.id,
                None,
                details["cleaning_metadata"].get("issues"),
                sheet_name,
            )

            sheet_columns_to_add.extend(columns_for_sheet)
            quality_issues_to_add.extend(issues_for_sheet)

            if index == 0 or sheet_name == primary_sheet_key:
                uploaded_file.dynamic_table_name = table_name

            sheet_summary = {
                "sheet_name": sheet_name,
                "table_name": table_name,
                "row_count": sheet_model.row_count,
                "column_count": sheet_model.column_count,
                "cleaning_metadata": details["cleaning_metadata"],
                "dataframe_info": details["dataframe_info"],
                "numeric_stats": details["numeric_stats"],
                "column_analysis": details["column_analysis"],
            }
            sheet_summaries.append(sheet_summary)

        # Add all records in a single transaction
        try:
            db.add_all(sheet_models)
            db.flush()  # Assign IDs to sheet models

            # Update the sheet_id in columns and issues now that we have the IDs
            for sheet_model in sheet_models:
                sheet_id_mapping[sheet_model.sheet_name] = sheet_model.id

            # Update sheet_id in collected columns and issues
            for column in sheet_columns_to_add:
                column.sheet_id = sheet_id_mapping.get(column.sheet_name) if hasattr(column, 'sheet_name') else None

            for issue in quality_issues_to_add:
                issue.sheet_id = sheet_id_mapping.get(issue.sheet_name) if hasattr(issue, 'sheet_name') else None

            db.add_all(sheet_columns_to_add)
            db.add_all(quality_issues_to_add)
            db.commit()
        except Exception as e:
            db.rollback()
            # Clean up any created tables if transaction fails
            for sheet_model in sheet_models:
                try:
                    with engine.connect() as conn:
                        conn.exec_driver_sql(f'DROP TABLE IF EXISTS "{sheet_model.table_name}"')
                        conn.commit()
                except:
                    pass  # Ignore cleanup errors
            raise e

        response_payload = {
            "message": "File uploaded and processed successfully.",
            "file_id": uploaded_file.id,
            "filename": uploaded_file.original_filename,
            "unique_filename": uploaded_file.filename,
            "size": uploaded_file.file_size,
            "file_hash": uploaded_file.file_hash,
            "validation": validation_result,
            "sheet_names": sheet_names,
            "sheet_summaries": sheet_summaries,
            "processing_time_seconds": uploaded_file.processing_time_seconds,
            "status": "success",
        }

        primary_summary = next((summary for summary in sheet_summaries if summary["sheet_name"] == primary_sheet_key), None)
        if primary_summary:
            response_payload["processed_data"] = {
                "dataframe_info": primary_summary["dataframe_info"],
                "numeric_stats": primary_summary["numeric_stats"],
                "column_analysis": primary_summary["column_analysis"],
            }

        return response_payload

    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during upload: {str(exc)}")
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(exc)}")
    finally:
        await file.close()


@app.get("/files", response_model=Dict[str, Any])
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """List previously uploaded files with pagination."""
    files = (
        db.query(UploadedFileModel)
        .order_by(UploadedFileModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    payload = []
    for file_record in files:
        payload.append(
            {
                "id": file_record.id,
                "filename": file_record.filename,
                "original_filename": file_record.original_filename,
                "file_size": file_record.file_size,
                "status": file_record.status,
                "total_rows": file_record.total_rows,
                "total_columns": file_record.total_columns,
                "total_sheets": file_record.total_sheets,
                "sheet_names": file_record.sheet_names,
                "created_at": file_record.created_at.isoformat() if file_record.created_at else None,
                "processed_at": file_record.processed_at.isoformat() if file_record.processed_at else None,
                "processing_time_seconds": file_record.processing_time_seconds,
                "error_message": file_record.error_message,
            }
        )

    return {"files": payload, "total": len(payload), "skip": skip, "limit": limit}


@app.get("/files/{file_id}", response_model=Dict[str, Any])
async def get_file(file_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve detailed metadata for a single uploaded file."""
    file_record: Optional[UploadedFileModel] = (
        db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
    )
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found.")

    sheets = db.query(FileSheet).filter(FileSheet.file_id == file_id).all()
    sheet_payload = []
    for sheet in sheets:
        columns = (
            db.query(SheetColumn)
            .filter(SheetColumn.file_id == file_id, SheetColumn.sheet_id == sheet.id)
            .order_by(SheetColumn.column_index)
            .all()
        )
        sheet_payload.append(
            {
                **_serialize_sheet(sheet),
                "columns": [_serialize_column(column) for column in columns],
                "cleaning_metadata": (file_record.cleaning_metadata or {}).get(sheet.sheet_name)
                if file_record.cleaning_metadata
                else None,
            }
        )

    response = {
        "id": file_record.id,
        "filename": file_record.filename,
        "original_filename": file_record.original_filename,
        "file_path": file_record.file_path,
        "file_size": file_record.file_size,
        "file_hash": file_record.file_hash,
        "mime_type": file_record.mime_type,
        "status": file_record.status,
        "total_rows": file_record.total_rows,
        "total_columns": file_record.total_columns,
        "total_sheets": file_record.total_sheets,
        "sheet_names": file_record.sheet_names,
        "created_at": file_record.created_at.isoformat() if file_record.created_at else None,
        "processed_at": file_record.processed_at.isoformat() if file_record.processed_at else None,
        "processing_time_seconds": file_record.processing_time_seconds,
        "cleaning_metadata": file_record.cleaning_metadata,
        "dynamic_table_name": file_record.dynamic_table_name,
        "sheets": sheet_payload,
    }

    # Provide top-level processed data if available (primary sheet)
    if file_record.dynamic_table_name:
        columns, data = _fetch_table_preview(file_record.id, file_record.dynamic_table_name, rows=10)
        response["processed_data"] = {
            "preview_columns": columns,
            "preview_rows": data,
            "schema": get_table_schema(file_record.dynamic_table_name, engine),
        }

    return response


@app.get("/files/{file_id}/metadata", response_model=Dict[str, Any])
async def get_file_metadata(file_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return dataset-level metadata, including sheet names and cleaning scores."""
    file_record = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found.")

    return {
        "file_id": file_record.id,
        "sheet_names": file_record.sheet_names or [],
        "cleaning_metadata": file_record.cleaning_metadata or {},
        "total_sheets": file_record.total_sheets,
        "total_rows": file_record.total_rows,
    }


@app.get("/files/{file_id}/sheets", response_model=Dict[str, Any])
async def list_file_sheets(file_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """List sheets and their high-level metadata for a file."""
    sheets = db.query(FileSheet).filter(FileSheet.file_id == file_id).order_by(FileSheet.id).all()
    if not sheets:
        raise HTTPException(status_code=404, detail="No sheets found for file.")

    return {"file_id": file_id, "sheets": [_serialize_sheet(sheet) for sheet in sheets]}


@app.get("/files/{file_id}/sheets/{sheet_id}", response_model=Dict[str, Any])
async def get_sheet_detail(file_id: int, sheet_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve metadata for an individual sheet, including columns and cleaning results."""
    sheet = (
        db.query(FileSheet)
        .filter(FileSheet.file_id == file_id, FileSheet.id == sheet_id)
        .first()
    )
    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found.")

    columns = (
        db.query(SheetColumn)
        .filter(SheetColumn.file_id == file_id, SheetColumn.sheet_id == sheet_id)
        .order_by(SheetColumn.column_index)
        .all()
    )

    issues = (
        db.query(DataQualityIssue)
        .filter(DataQualityIssue.file_id == file_id, DataQualityIssue.sheet_id == sheet_id)
        .all()
    )

    return {
        "sheet": _serialize_sheet(sheet),
        "columns": [_serialize_column(column) for column in columns],
        "quality_issues": [
            {
                "issue_id": issue.id,
                "issue_type": issue.issue_type,
                "severity": issue.severity,
                "description": issue.description,
                "resolved": issue.resolved,
                "detected_at": issue.detected_at.isoformat() if issue.detected_at else None,
            }
            for issue in issues
        ],
    }


@app.get("/files/{file_id}/preview", response_model=Dict[str, Any])
async def get_file_preview(
    file_id: int,
    rows: int = Query(10, ge=1, le=100),
    sheet_id: Optional[int] = Query(default=None),
    sheet_name: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retrieve preview data for a sheet in a file.

    Consumers can specify a sheet either by sheet_id or sheet_name.
    Defaults to the primary sheet when no identifier is provided.
    """
    file_record = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found.")

    sheet_query = db.query(FileSheet).filter(FileSheet.file_id == file_id)
    if sheet_id is not None:
        sheet = sheet_query.filter(FileSheet.id == sheet_id).first()
    elif sheet_name is not None:
        sheet = sheet_query.filter(FileSheet.sheet_name == sheet_name).first()
    else:
        sheet = sheet_query.order_by(FileSheet.id).first()

    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found for preview.")

    columns, data = _fetch_table_preview(file_id, sheet.table_name, rows)
    return {
        "file_id": file_id,
        "sheet_id": sheet.id,
        "sheet_name": sheet.sheet_name,
        "preview_rows": rows,
        "columns": columns,
        "data": data,
    }


@app.delete("/files/{file_id}", response_model=Dict[str, Any])
async def delete_file(file_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Delete an uploaded file and associated metadata."""
    file_record = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        # Delete physical file
        if os.path.exists(file_record.file_path):
            os.remove(file_record.file_path)

        # Delete associated metadata
        db.query(DataQualityIssue).filter(DataQualityIssue.file_id == file_id).delete()
        db.query(SheetColumn).filter(SheetColumn.file_id == file_id).delete()
        db.query(FileSheet).filter(FileSheet.file_id == file_id).delete()
        db.query(QueryHistory).filter(QueryHistory.file_id == file_id).delete()
        db.delete(file_record)
        db.commit()

        return {
            "message": "File deleted successfully.",
            "file_id": file_id,
            "filename": file_record.original_filename,
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(exc)}")


@app.get("/files/{file_id}/query-history", response_model=Dict[str, Any])
async def get_query_history(file_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return recent AI query history for a file."""
    history = (
        db.query(QueryHistory)
        .filter(QueryHistory.file_id == file_id)
        .order_by(QueryHistory.created_at.desc())
        .limit(100)
        .all()
    )

    return {
        "file_id": file_id,
        "history": [
            {
                "query_id": entry.id,
                "query": entry.natural_language_query,
                "sql_query": entry.sql_query,
                "response": entry.response_text,
                "visualization_type": entry.visualization_type,
                "visualization_config": entry.visualization_config,
                "rows_returned": entry.rows_returned,
                "execution_time_ms": entry.execution_time_ms,
                "status": entry.status,
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
            }
            for entry in history
        ],
    }


@app.post("/ai/query", response_model=Dict[str, Any])
async def ai_query(
    request: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Execute an AI-powered natural language query against a file's primary sheet.

    The endpoint orchestrates SQL generation, execution, visualization recommendation,
    and query history persistence.
    """
    if not request.file_id:
        raise HTTPException(status_code=400, detail="file_id is required for AI queries.")

    file_record = db.query(UploadedFileModel).filter(UploadedFileModel.id == request.file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found.")

    sheet_model, table_name = _resolve_primary_sheet(file_record, db)
    gemini_service = get_gemini_service()

    # Build context payload
    context_payload: Dict[str, Any] = request.model_dump()
    context_payload["sheet_name"] = sheet_model.sheet_name
    context_payload["schemas"] = get_table_schema(table_name, engine)
    context_payload["cleaning_metadata"] = (file_record.cleaning_metadata or {}).get(sheet_model.sheet_name)

    session_record: Optional[ChatSession] = None
    if request.session_id:
        try:
            session_record = chat_service.get_session(db, current_user.id, request.session_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
    else:
        session_record = chat_service.create_session(
            db,
            user_id=current_user.id,
            title=request.session_title,
            file_id=file_record.id,
        )

    user_message = chat_service.add_message(
        db,
        session_record,
        role="user",
        content=request.query,
        user_id=current_user.id,
    )

    response_messages: List[ChatMessageResponse] = [ChatMessageResponse.model_validate(user_message)]

    try:
        start_time = datetime.utcnow()
        ai_result = gemini_service.execute_ai_query(context_payload, table_name, engine)
        end_time = datetime.utcnow()

        if ai_result.get("status") != "completed":
            raise HTTPException(status_code=500, detail=ai_result.get("error", "AI query failed."))

        executed_results = ai_result.get("executed_results", {})
        row_count = executed_results.get("row_count")

        # Persist query history
        history_entry = QueryHistory(
            file_id=file_record.id,
            natural_language_query=request.query,
            processed_query=context_payload.get("context"),
            sql_query=ai_result.get("sql_query"),
            response_text=ai_result.get("explanation"),
            visualization_type=None,
            visualization_config=ai_result.get("visualizations"),
            execution_time_ms=(end_time - start_time).total_seconds() * 1000.0,
            rows_returned=row_count,
            status=ai_result.get("status", "completed"),
            executed_at=end_time,
            user_id=current_user.id,
            session_id=session_record.id,
        )
        db.add(history_entry)
        db.commit()

        assistant_message = chat_service.add_message(
            db,
            session_record,
            role="assistant",
            content=ai_result.get("explanation") or "Analysis completed.",
            sql_query=ai_result.get("sql_query"),
            payload={
                "query_id": history_entry.id,
                "visualizations": ai_result.get("visualizations"),
                "executed_results": executed_results,
            },
        )
        response_messages.append(ChatMessageResponse.model_validate(assistant_message))

        message_count = db.query(ChatMessage.id).filter(ChatMessage.session_id == session_record.id).count()
        assistant_preview = (
            db.query(ChatMessage.content)
            .filter(ChatMessage.session_id == session_record.id, ChatMessage.role == "assistant")
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
            .scalar()
        )
        session_summary = ChatSessionSummary(
            id=session_record.id,
            title=session_record.title,
            summary=session_record.summary,
            file_id=session_record.file_id,
            is_archived=session_record.is_archived,
            created_at=session_record.created_at,
            updated_at=session_record.updated_at,
            last_interaction_at=session_record.last_interaction_at,
            message_count=message_count,
            assistant_preview=assistant_preview,
        )

        return {
            "status": ai_result.get("status"),
            "query": request.query,
            "sql_query": ai_result.get("sql_query"),
            "executed_results": executed_results,
            "visualizations": ai_result.get("visualizations"),
            "explanation": ai_result.get("explanation"),
            "data_quality_disclaimer": ai_result.get("data_quality_disclaimer"),
            "query_id": history_entry.id,
            "session_id": session_record.id,
            "created_session": session_summary,
            "messages": response_messages,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI query execution failed: {str(exc)}")


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    """Return JSON error responses with FastAPI HTTPException."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info",
    )