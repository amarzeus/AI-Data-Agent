"""Authentication service for user management, JWT issuance, and profile updates."""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import RefreshToken, User, UserProfile
from ..models.schemas import (
    LoginRequest,
    TokenPair,
    TokenRefreshRequest,
    UserCreate,
    UserUpdate,
)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.TOKEN_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS


class AuthService:
    """Encapsulates all authentication logic for the dashboard."""

    def __init__(self, secret_key: Optional[str] = None) -> None:
        self.secret_key = secret_key or settings.SECRET_KEY

    # ------------------------------------------------------------------
    # Password helpers
    # ------------------------------------------------------------------
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return pwd_context.verify(password, hashed_password)

    # ------------------------------------------------------------------
    # Token helpers
    # ------------------------------------------------------------------
    def _create_token(self, subject: str, expires_delta: timedelta, token_type: str) -> str:
        now = datetime.utcnow()
        payload = {
            "sub": subject,
            "iat": now,
            "exp": now + expires_delta,
            "type": token_type,
        }
        return jwt.encode(payload, self.secret_key, algorithm=ALGORITHM)

    def create_access_token(self, user: User) -> str:
        return self._create_token(str(user.id), timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), "access")

    def create_refresh_token(self, user: User) -> str:
        return self._create_token(str(user.id), timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), "refresh")

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[ALGORITHM])
        except JWTError:
            return None

    # ------------------------------------------------------------------
    # User operations
    # ------------------------------------------------------------------
    def create_user(self, db: Session, payload: UserCreate) -> User:
        existing = db.query(User).filter(User.email == payload.email.lower()).first()
        if existing:
            raise ValueError("Email already registered")

        hashed_password = self.hash_password(payload.password)
        user = User(
            email=payload.email.lower(),
            hashed_password=hashed_password,
            full_name=payload.full_name,
            is_active=payload.is_active,
            is_superuser=payload.is_superuser,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = UserProfile(user_id=user.id)
        db.add(profile)
        db.commit()

        return user

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user or not user.is_active:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None

        user.last_login_at = datetime.utcnow()
        db.commit()
        return user

    def update_user(self, db: Session, user: User, payload: UserUpdate) -> User:
        if payload.full_name is not None:
            user.full_name = payload.full_name
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.is_superuser is not None:
            user.is_superuser = payload.is_superuser
        if payload.password:
            user.hashed_password = self.hash_password(payload.password)

        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # ------------------------------------------------------------------
    # Token persistence
    # ------------------------------------------------------------------
    def store_refresh_token(self, db: Session, user: User, token: str, user_agent: str = "", ip_address: str = "") -> RefreshToken:
        token_hash = self.hash_password(token)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        refresh = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            user_agent=user_agent[:255],
            ip_address=ip_address[:100],
            expires_at=expires_at,
        )
        db.add(refresh)
        db.commit()
        db.refresh(refresh)
        return refresh

    def revoke_refresh_token(self, db: Session, token_id: int) -> None:
        refresh = db.query(RefreshToken).filter(RefreshToken.id == token_id).first()
        if refresh:
            refresh.revoked = True
            refresh.revoked_at = datetime.utcnow()
            db.commit()

    def verify_refresh_token(self, db: Session, refresh_token: str) -> Optional[RefreshToken]:
        decoded = self.decode_token(refresh_token)
        if not decoded or decoded.get("type") != "refresh":
            return None

        user_id = int(decoded["sub"])
        candidate_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.utcnow(),
        ).all()

        for token_record in candidate_tokens:
            if pwd_context.verify(refresh_token, token_record.token_hash):
                return token_record
        return None

    # ------------------------------------------------------------------
    # Token orchestration
    # ------------------------------------------------------------------
    def issue_token_pair(self, db: Session, user: User, user_agent: str = "", ip_address: str = "") -> TokenPair:
        access_token = self.create_access_token(user)
        refresh_token = self.create_refresh_token(user)
        self.store_refresh_token(db, user, refresh_token, user_agent=user_agent, ip_address=ip_address)
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    def refresh_tokens(self, db: Session, payload: TokenRefreshRequest, user_agent: str = "", ip_address: str = "") -> Optional[TokenPair]:
        refresh_record = self.verify_refresh_token(db, payload.refresh_token)
        if not refresh_record:
            return None

        if refresh_record.user is None or not refresh_record.user.is_active:
            return None

        self.revoke_refresh_token(db, refresh_record.id)
        return self.issue_token_pair(db, refresh_record.user, user_agent=user_agent, ip_address=ip_address)


auth_service = AuthService()

