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
from .auth import get_current_user

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
    current_user=Depends(get_current_user),
) -> ChatSessionListResponse:
    sessions = chat_service.list_sessions(db, current_user.id, include_archived=include_archived)
    items = []
    for session, _, _ in sessions:
        message_count, assistant_preview = _session_metrics(db, session.id)
        items.append(_serialize_session(session, message_count, assistant_preview))
    return ChatSessionListResponse(sessions=items)


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ChatSessionResponse:
    session = chat_service.create_session(
        db,
        user_id=current_user.id,
        title=payload.title,
        file_id=payload.file_id,
    )
    summary = _serialize_session(session, 0, None)
    return ChatSessionResponse(session=summary)


def _get_session_or_404(db: Session, user_id: int, session_id: int) -> ChatSession:
    try:
        return chat_service.get_session(db, user_id, session_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ChatSessionResponse:
    session = _get_session_or_404(db, current_user.id, session_id)
    message_count, assistant_preview = _session_metrics(db, session.id)
    summary = _serialize_session(session, message_count, assistant_preview)
    return ChatSessionResponse(session=summary)


def _session_metrics(db: Session, session_id: int) -> tuple[int, Optional[str]]:
    message_count = db.query(ChatMessage.id).filter(ChatMessage.session_id == session_id).count()
    assistant_preview = (
        db.query(ChatMessage.content)
        .filter(ChatMessage.session_id == session_id, ChatMessage.role == "assistant")
        .order_by(ChatMessage.created_at.desc())
        .limit(1)
        .scalar()
    )
    return message_count, assistant_preview


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session(
    session_id: int,
    payload: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ChatSessionResponse:
    session = _get_session_or_404(db, current_user.id, session_id)
    updated = chat_service.update_session(
        db,
        session,
        title=payload.title,
        summary=payload.summary,
        is_archived=payload.is_archived,
        file_id=payload.file_id,
    )
    message_count, assistant_preview = _session_metrics(db, session.id)
    summary = _serialize_session(updated, message_count, assistant_preview)
    return ChatSessionResponse(session=summary)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    session = _get_session_or_404(db, current_user.id, session_id)
    chat_service.delete_session(db, session)


@router.get("/sessions/{session_id}/messages", response_model=ChatMessageListResponse)
def list_messages(
    session_id: int,
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ChatMessageListResponse:
    session = _get_session_or_404(db, current_user.id, session_id)
    messages = chat_service.list_messages(db, session.id, limit=limit, offset=offset)
    payload = [ChatMessageResponse.model_validate(message) for message in messages]
    return ChatMessageListResponse(session_id=session.id, messages=payload)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ChatMessageResponse:
    session = _get_session_or_404(db, current_user.id, session_id)
    message = chat_service.add_message(
        db,
        session,
        role=payload.role,
        content=payload.content,
        user_id=current_user.id if payload.role == "user" else None,
        sql_query=payload.sql_query,
        payload=payload.payload,
    )
    return ChatMessageResponse.model_validate(message)
