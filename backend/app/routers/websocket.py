"""
WebSocket router for real-time communication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import asyncio
from ..core.config import get_db
from ..models.base import ChatSession, ChatMessage
from ..services.gemini_service import get_gemini_service

router = APIRouter(prefix="/ws", tags=["WebSocket"])

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_personal_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for websocket in self.active_connections.values():
            try:
                await websocket.send_json(message)
            except:
                pass

manager = ConnectionManager()

@router.websocket("/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for real-time chat communication
    """
    await manager.connect(websocket, session_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message_type = message_data.get("type")

            if message_type == "user_query":
                # Handle user query
                query = message_data.get("query")
                file_id = message_data.get("file_id")

                # Send typing indicator
                await manager.send_personal_message(session_id, {
                    "event": "typing_start"
                })

                # Process AI query
                try:
                    from ..models.base import UploadedFile
                    file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
                    if not file or not file.dynamic_table_name:
                        await manager.send_personal_message(session_id, {
                            "event": "error",
                            "message": "File not found or not processed"
                        })
                        continue

                    gemini_service = get_gemini_service()
                    ai_request = {
                        "query": query,
                        "file_id": file_id,
                        "context": message_data.get("context")
                    }

                    result = gemini_service.execute_ai_query(ai_request, file.dynamic_table_name, db.bind)

                    # Send typing end
                    await manager.send_personal_message(session_id, {
                        "event": "typing_end"
                    })

                    # Send AI response
                    await manager.send_personal_message(session_id, {
                        "event": "ai_response",
                        "explanation": result.get("explanation", "Analysis complete"),
                        "sql_query": result.get("sql_query"),
                        "visualizations": result.get("visualizations", []),
                        "executed_results": result.get("executed_results", [])
                    })

                    # Save to database
                    session = db.query(ChatSession).filter(ChatSession.id == int(session_id)).first()
                    if session:
                        user_message = ChatMessage(
                            session_id=session.id,
                            role="user",
                            content=query,
                            user_id=1  # Anonymous user
                        )
                        db.add(user_message)

                        assistant_message = ChatMessage(
                            session_id=session.id,
                            role="assistant",
                            content=result.get("explanation", "Analysis complete"),
                            sql_query=result.get("sql_query"),
                            payload={
                                "executed_results": result.get("executed_results"),
                                "visualizations": result.get("visualizations")
                            },
                            user_id=1
                        )
                        db.add(assistant_message)
                        db.commit()

                except Exception as e:
                    await manager.send_personal_message(session_id, {
                        "event": "error",
                        "message": str(e)
                    })

            elif message_type == "typing_start":
                # Broadcast typing indicator to other users in same session
                await manager.send_personal_message(session_id, {
                    "event": "typing_start"
                })

            elif message_type == "typing_end":
                # Broadcast typing end to other users in same session
                await manager.send_personal_message(session_id, {
                    "event": "typing_end"
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(session_id)
