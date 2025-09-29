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

