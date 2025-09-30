"""Authentication and profile management routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..core.config import get_db
from ..models import User, UserProfile
from ..models.schemas import (
    LoginRequest,
    PasswordResetRequest,
    PasswordUpdateRequest,
    ProfileResponse,
    TokenPair,
    TokenRefreshRequest,
    UserCreate,
    UserProfileUpdate,
    UserResponse,
)
from ..services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer(auto_error=False)


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    try:
        user = auth_service.create_user(db, payload)
        return user
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=TokenPair)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_agent = request.headers.get("user-agent", "")
    client_host = request.client.host if request.client else ""
    return auth_service.issue_token_pair(db, user, user_agent=user_agent, ip_address=client_host)


@router.post("/login/form", response_model=TokenPair)
def login_form(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> TokenPair:
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_agent = request.headers.get("user-agent", "")
    client_host = request.client.host if request.client else ""
    return auth_service.issue_token_pair(db, user, user_agent=user_agent, ip_address=client_host)


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(request: Request, payload: TokenRefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    user_agent = request.headers.get("user-agent", "")
    client_host = request.client.host if request.client else ""
    token_pair = auth_service.refresh_tokens(db, payload, user_agent=user_agent, ip_address=client_host)
    if not token_pair:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return token_pair


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: TokenRefreshRequest, db: Session = Depends(get_db)) -> None:
    refresh = auth_service.verify_refresh_token(db, payload.refresh_token)
    if refresh:
        auth_service.revoke_refresh_token(db, refresh.id)


def _extract_token(credentials: Optional[HTTPAuthorizationCredentials]) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return credentials.credentials


def _resolve_token_user(token: str, db: Session) -> User:
    payload = auth_service.decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return _get_user_or_404(db, int(payload["sub"]))


@router.get("/me", response_model=UserResponse)
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserResponse:
    token = _extract_token(credentials)
    user = _resolve_token_user(token, db)
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Reusable dependency for retrieving the authenticated user."""
    token = _extract_token(credentials)
    return _resolve_token_user(token, db)


@router.put("/me", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserResponse:
    token = _extract_token(credentials)
    user = _resolve_token_user(token, db)
    profile = user.profile
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/profile", response_model=ProfileResponse)
def get_profile_details(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    token = _extract_token(credentials)
    user = _resolve_token_user(token, db)
    if not user.profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return user.profile


@router.post("/password/reset", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(payload: PasswordResetRequest) -> None:
    # TODO: integrate email service
    return None


@router.post("/password/update", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    payload: PasswordUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> None:
    token = _extract_token(credentials)
    user = _resolve_token_user(token, db)
    if not auth_service.verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    user.hashed_password = auth_service.hash_password(payload.new_password)
    db.add(user)
    db.commit()


@router.get("/export-data")
def export_user_data(
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user data including profile, preferences, and activity history.

    Supported formats: json, csv, pdf
    """
    from datetime import datetime
    import json

    # Get user's complete profile information
    user_data = {
        "export_timestamp": datetime.utcnow().isoformat(),
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat(),
        "last_login": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
        "profile": None,
        "preferences": {},
        "query_history": [],
        "sessions": []
    }

    # Get profile information
    if current_user.profile:
        user_data["profile"] = {
            "job_title": current_user.profile.job_title,
            "department": current_user.profile.department,
            "bio": current_user.profile.bio,
            "location": current_user.profile.location,
            "phone_number": current_user.profile.phone_number,
            "avatar_url": current_user.profile.avatar_url,
            "preferences": current_user.profile.preferences,
            "created_at": current_user.profile.created_at.isoformat(),
            "updated_at": current_user.profile.updated_at.isoformat()
        }
        user_data["preferences"] = current_user.profile.preferences or {}

    # Get query history
    from ..models import QueryHistory
    queries = db.query(QueryHistory).filter(QueryHistory.user_id == current_user.id).limit(1000).all()
    user_data["query_history"] = [
        {
            "query_id": query.id,
            "natural_language_query": query.natural_language_query,
            "sql_query": query.sql_query,
            "response_text": query.response_text,
            "execution_time_ms": query.execution_time_ms,
            "rows_returned": query.rows_returned,
            "status": query.status,
            "created_at": query.created_at.isoformat() if query.created_at else None
        }
        for query in queries
    ]

    # Get chat sessions
    from ..models import ChatSession
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
    user_data["sessions"] = [
        {
            "session_id": session.id,
            "title": session.title,
            "file_id": session.file_id,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
            "message_count": session.message_count
        }
        for session in sessions
    ]

    if format == "json":
        return JSONResponse(
            content=user_data,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=user-data-{datetime.utcnow().strftime('%Y%m%d')}.json"}
        )

    elif format == "csv":
        # Convert to CSV format
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)

        # Write user info
        writer.writerow(["User Information"])
        writer.writerow(["Field", "Value"])
        writer.writerow(["User ID", user_data["user_id"]])
        writer.writerow(["Email", user_data["email"]])
        writer.writerow(["Full Name", user_data["full_name"]])
        writer.writerow(["Created At", user_data["created_at"]])
        writer.writerow(["Last Login", user_data["last_login"]])
        writer.writerow([])

        # Write profile info
        if user_data["profile"]:
            writer.writerow(["Profile Information"])
            writer.writerow(["Field", "Value"])
            for key, value in user_data["profile"].items():
                if key not in ["preferences"]:  # Skip complex nested data
                    writer.writerow([key, value])
            writer.writerow([])

        # Write query history
        writer.writerow(["Query History"])
        writer.writerow(["Query ID", "Query", "SQL Query", "Status", "Created At", "Execution Time (ms)", "Rows Returned"])
        for query in user_data["query_history"]:
            writer.writerow([
                query["query_id"],
                query["natural_language_query"][:100] + "..." if len(query["natural_language_query"]) > 100 else query["natural_language_query"],
                query["sql_query"][:100] + "..." if query["sql_query"] and len(query["sql_query"]) > 100 else (query["sql_query"] or ""),
                query["status"],
                query["created_at"],
                query["execution_time_ms"],
                query["rows_returned"]
            ])

        csv_content = output.getvalue()
        return JSONResponse(
            content={"data": csv_content},
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=user-data-{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )

    else:  # PDF format - simplified text response for now
        return JSONResponse(
            content={"message": "PDF export not yet implemented", "data": user_data},
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=user-data-{datetime.utcnow().strftime('%Y%m%d')}.json"}
        )

