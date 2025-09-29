"""
AI-powered query processing router
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..core.config import get_db
from ..models.base import UploadedFile as UploadedFileModel
from ..services.gemini_service import get_gemini_service

router = APIRouter(prefix="/ai", tags=["AI Queries"])

@router.post("/generate-sql")
async def generate_sql(request: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Generate SQL from natural language query

    Args:
        request: Dictionary containing query, file_id, context
        db: Database session

    Returns:
        AI-generated SQL and analysis
    """
    try:
        query_text = request.get("query", "")
        file_id = request.get("file_id")
        context = request.get("context")

        if not query_text:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")

        # Get file from database
        file = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        if not file.dynamic_table_name:
            raise HTTPException(status_code=400, detail="File does not have a dynamic table")

        # Get Gemini service and execute AI query
        gemini_service = get_gemini_service()
        result = gemini_service.execute_ai_query(request, file.dynamic_table_name, db.bind)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")

@router.post("/execute-sql")
async def execute_sql_endpoint(request: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Execute SQL query on dynamic table

    Args:
        request: Dictionary with file_id and sql_query
        db: Database session

    Returns:
        Query execution results
    """
    try:
        file_id = request.get("file_id")
        sql_query = request.get("sql_query")

        if not file_id or not sql_query:
            raise HTTPException(status_code=400, detail="file_id and sql_query are required")

        # Get file from database
        file = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        if not file.dynamic_table_name:
            raise HTTPException(status_code=400, detail="File does not have a dynamic table")

        # Execute SQL
        from ..utils.database import execute_sql
        result_df = execute_sql(file.dynamic_table_name, sql_query, db.bind)

        return {
            "status": "success",
            "data": result_df.to_dict('records'),
            "columns": [{'name': col, 'type': str(result_df[col].dtype)} for col in result_df.columns],
            "row_count": len(result_df)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL execution failed: {str(e)}")

@router.post("/query")
async def ai_query_endpoint(request: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Execute AI-powered natural language query with full pipeline

    Args:
        request: Dictionary containing query, file_id, context
        db: Database session

    Returns:
        Complete AI query results with visualizations
    """
    try:
        query_text = request.get("query", "")
        file_id = request.get("file_id")
        context = request.get("context")

        if not query_text:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")

        # Get file from database
        file = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        if not file.dynamic_table_name:
            raise HTTPException(status_code=400, detail="File does not have a dynamic table")

        # Get Gemini service and execute AI query
        gemini_service = get_gemini_service()
        result = gemini_service.execute_ai_query(request, file.dynamic_table_name, db.bind)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")
