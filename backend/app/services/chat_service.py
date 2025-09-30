from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.base import ChatMessage, ChatSession


class ChatService:
    """Service layer for managing persistent chat sessions and messages."""

    def list_sessions(
        self,
        db: Session,
        include_archived: bool = False,
    ) -> List[Tuple[ChatSession, int, Optional[str]]]:
        """Return chat sessions sorted by last interaction."""
        query = (
            db.query(
                ChatSession,
                func.count(ChatMessage.id).label("message_count"),
                func.max(ChatMessage.content).filter(ChatMessage.role == "assistant").label("assistant_preview"),
            )
            .outerjoin(ChatMessage, ChatMessage.session_id == ChatSession.id)
            .group_by(ChatSession.id)
        )

        if not include_archived:
            query = query.filter(ChatSession.is_archived.is_(False))

        query = query.order_by(func.coalesce(ChatSession.last_interaction_at, ChatSession.created_at).desc())
        return query.all()

    def create_session(
        self,
        db: Session,
        title: Optional[str] = None,
        file_id: Optional[int] = None,
        user_id: int = 1,
    ) -> ChatSession:
        """Create a new chat session."""
        now = datetime.utcnow()
        session = ChatSession(
            user_id=user_id,
            file_id=file_id,
            title=title or "New conversation",
            last_interaction_at=now,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_session(self, db: Session, session_id: int) -> ChatSession:
        """Return a chat session."""
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .first()
        )
        if not session:
            raise ValueError("Chat session not found")
        return session

    def update_session(
        self,
        db: Session,
        session: ChatSession,
        *,
        title: Optional[str] = None,
        summary: Optional[str] = None,
        is_archived: Optional[bool] = None,
        file_id: Optional[int] = None,
    ) -> ChatSession:
        """Update a chat session's metadata."""
        updated = False
        if title is not None:
            session.title = title.strip() or session.title
            updated = True
        if summary is not None:
            session.summary = summary
            updated = True
        if is_archived is not None:
            session.is_archived = is_archived
            updated = True
        if file_id is not None and session.file_id != file_id:
            session.file_id = file_id
            updated = True
        if updated:
            session.updated_at = datetime.utcnow()
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def delete_session(self, db: Session, session: ChatSession) -> None:
        """Delete a chat session and its messages."""
        db.delete(session)
        db.commit()

    def list_messages(
        self,
        db: Session,
        session_id: int,
        limit: int = 200,
        offset: int = 0,
    ) -> List[ChatMessage]:
        """Fetch messages for a session ordered chronologically."""
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def add_message(
        self,
        db: Session,
        session: ChatSession,
        *,
        role: str,
        content: str,
        sql_query: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None,
    ) -> ChatMessage:
        """Persist a chat message and update session timestamps."""
        message = ChatMessage(
            session_id=session.id,
            user_id=user_id,
            role=role,
            content=content,
            sql_query=sql_query,
            payload=payload,
        )
        now = datetime.utcnow()
        session.last_interaction_at = now
        session.updated_at = now
        if role == "user" and not session.summary:
            session.summary = content[:140]
        if session.is_archived:
            session.is_archived = False
        db.add(message)
        db.add(session)
        db.commit()
        db.refresh(message)
        return message


chat_service = ChatService()
