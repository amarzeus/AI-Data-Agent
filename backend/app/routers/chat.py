from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.config import get_db
from ..models.base import ChatMessage, ChatSession
from ..models.schemas import (
    ChatMessageCreate,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionSummary,
    ChatSessionUpdate,
)
from ..services import chat_service
from ..services.gemini_service import get_gemini_service

router = APIRouter(prefix="/chat", tags=["Chat"])


def _serialize_session(summary_source: ChatSession, message_count: int, assistant_preview: Optional[str]) -> ChatSessionSummary:
    return ChatSessionSummary(
        id=summary_source.id,
        title=summary_source.title,
        summary=summary_source.summary,
        file_id=summary_source.file_id,
        is_archived=summary_source.is_archived,
        created_at=summary_source.created_at,
        updated_at=summary_source.updated_at,
        last_interaction_at=summary_source.last_interaction_at,
        message_count=message_count,
        assistant_preview=assistant_preview,
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_sessions(
    include_archived: bool = Query(False, description="Include archived sessions in the response"),
    db: Session = Depends(get_db),
):
    """List chat sessions"""
    query = db.query(ChatSession)

    if not include_archived:
        query = query.filter(ChatSession.is_archived == False)

    sessions = query.order_by(ChatSession.updated_at.desc()).all()

    session_summaries = []
    for session in sessions:
        # Count messages for each session
        message_count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()

        # Get the latest assistant message for preview
        assistant_preview = None
        latest_assistant = (
            db.query(ChatMessage.content)
            .filter(ChatMessage.session_id == session.id, ChatMessage.role == "assistant")
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        if latest_assistant:
            assistant_preview = latest_assistant.content[:100] + "..." if len(latest_assistant.content) > 100 else latest_assistant.content

        session_summaries.append(_serialize_session(session, message_count, assistant_preview))

    return ChatSessionListResponse(sessions=session_summaries)


@router.post("/send-message")
async def send_message(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Send a message and get AI response

    Args:
        request: Dictionary containing query, file_id, session_id, session_title
        db: Database session

    Returns:
        AI response with messages for chat interface
    """
    try:
        query_text = request.get("query", "")
        file_id = request.get("file_id")
        session_id = request.get("session_id")
        session_title = request.get("session_title")

        if not query_text:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")

        # Get or create chat session
        if session_id:
            try:
                session = chat_service.get_session(db, session_id)
            except ValueError:
                session = None

        if not session_id or not session:
            # Create new session
            session = chat_service.create_session(
                db,
                title=session_title or f"Query: {query_text[:50]}...",
                file_id=file_id,
                user_id=1  # Default anonymous user
            )

        # Add user message to database
        user_message = chat_service.add_message(
            db,
            session,
            role="user",
            content=query_text,
            user_id=1  # Default anonymous user
        )

        # Get AI response
        ai_request = {
            "query": query_text,
            "file_id": file_id,
            "context": request.get("context")
        }

        # Import here to avoid circular imports
        from ..models.base import UploadedFile
        file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        if not file or not file.dynamic_table_name:
            raise HTTPException(status_code=404, detail="File not found or not processed")

        gemini_service = get_gemini_service()
        ai_response = gemini_service.execute_ai_query(ai_request, file.dynamic_table_name, db.bind)

        # Add AI response to database
        assistant_message = chat_service.add_message(
            db,
            session,
            role="assistant",
            content=ai_response.get("explanation", "Analysis complete"),
            sql_query=ai_response.get("sql_query"),
            payload={
                "executed_results": ai_response.get("executed_results"),
                "visualizations": ai_response.get("visualizations"),
                "data_quality_disclaimer": ai_response.get("data_quality_disclaimer")
            },
            user_id=1  # Default anonymous user
        )

        # Return response in format expected by frontend
        return {
            "status": "completed",
            "query": query_text,
            "sql_query": ai_response.get("sql_query"),
            "executed_results": ai_response.get("executed_results"),
            "visualizations": ai_response.get("visualizations"),
            "explanation": ai_response.get("explanation"),
            "data_quality_disclaimer": ai_response.get("data_quality_disclaimer"),
            "session_id": session.id,
            "created_session": None if session_id else {
                "id": session.id,
                "title": session.title,
                "summary": session.summary,
                "file_id": session.file_id,
                "is_archived": session.is_archived,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
                "last_interaction_at": session.last_interaction_at.isoformat() if session.last_interaction_at else None,
                "message_count": 2,  # user + assistant messages
                "assistant_preview": ai_response.get("explanation", "")[:100] + "..." if len(ai_response.get("explanation", "")) > 100 else ai_response.get("explanation", "")
            },
            "messages": [
                {
                    "id": user_message.id,
                    "session_id": session.id,
                    "user_id": None,
                    "role": "user",
                    "content": user_message.content,
                    "sql_query": None,
                    "payload": None,
                    "created_at": user_message.created_at.isoformat()
                },
                {
                    "id": assistant_message.id,
                    "session_id": session.id,
                    "user_id": None,
                    "role": "assistant",
                    "content": assistant_message.content,
                    "sql_query": assistant_message.sql_query,
                    "payload": assistant_message.payload,
                    "created_at": assistant_message.created_at.isoformat()
                }
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat message failed: {str(e)}")


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: int,
    limit: int = Query(200, description="Maximum number of messages to return"),
    offset: int = Query(0, description="Number of messages to skip"),
    db: Session = Depends(get_db)
):
    """
    Get messages for a specific chat session

    Args:
        session_id: ID of the chat session
        limit: Maximum number of messages to return
        offset: Number of messages to skip
        db: Database session

    Returns:
        List of chat messages for the session
    """
    try:
        session = chat_service.get_session(db, session_id)
        messages = chat_service.list_messages(db, session_id, limit, offset)

        return ChatMessageListResponse(
            session_id=session_id,
            messages=[
                ChatMessageResponse(
                    id=msg.id,
                    session_id=msg.session_id,
                    user_id=msg.user_id,
                    role=msg.role,
                    content=msg.content,
                    sql_query=msg.sql_query,
                    payload=msg.payload,
                    created_at=msg.created_at.isoformat()
                )
                for msg in messages
            ]
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session messages: {str(e)}")


@router.post("/sessions")
async def create_session(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Create a new chat session

    Args:
        request: Dictionary containing title and file_id
        db: Database session

    Returns:
        Created chat session
    """
    try:
        title = request.get("title")
        file_id = request.get("file_id")

        session = chat_service.create_session(db, title=title, file_id=file_id, user_id=1)

        return ChatSessionResponse(
            session=ChatSessionSummary(
                id=session.id,
                title=session.title,
                summary=session.summary,
                file_id=session.file_id,
                is_archived=session.is_archived,
                created_at=session.created_at.isoformat(),
                updated_at=session.updated_at.isoformat(),
                last_interaction_at=session.last_interaction_at.isoformat() if session.last_interaction_at else None,
                message_count=0,
                assistant_preview=None
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")
