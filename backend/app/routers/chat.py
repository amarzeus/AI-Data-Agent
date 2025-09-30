from typing import Optional

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
