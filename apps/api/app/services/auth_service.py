from __future__ import annotations

import hashlib
import logging
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.models import User, UserSession
from app.schemas.auth import AuthLoginRequest, AuthRegisterRequest


logger = logging.getLogger(__name__)
_BCRYPT_SHA256_PREFIX = "bcrypt_sha256$"
EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
INVALID_CREDENTIALS_DETAIL = "账号或密码不正确。"
SESSION_INVALID_DETAIL = "登录状态已失效，请重新登录。"
NOT_LOGGED_IN_DETAIL = "当前未登录。"


@dataclass
class AuthResult:
    user: User
    session_token: str


class PasswordContext:
    @staticmethod
    def _coerce_secret(password: str) -> bytes:
        raw = password.encode("utf-8")
        if len(raw) <= 72:
            return raw
        return hashlib.sha256(raw).hexdigest().encode("ascii")

    def hash(self, password: str) -> str:
        secret = self._coerce_secret(password)
        digest = bcrypt.hashpw(secret, bcrypt.gensalt()).decode("utf-8")
        return f"{_BCRYPT_SHA256_PREFIX}{digest}"

    def verify(self, password: str, password_hash: str) -> bool:
        if not password_hash:
            return False

        secret = self._coerce_secret(password)
        stored_hash = password_hash.removeprefix(_BCRYPT_SHA256_PREFIX)

        try:
            return bcrypt.checkpw(secret, stored_hash.encode("utf-8"))
        except ValueError:
            return False


pwd_context = PasswordContext()


def _now() -> datetime:
    return datetime.now(UTC)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _build_session_expiry() -> datetime:
    return _now() + timedelta(seconds=settings.session_ttl_seconds)


def _coerce_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for", "").strip()
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


def _revoke_active_sessions_for_user(db: Session, user_id: int) -> None:
    active_sessions = db.scalars(
        select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
        ),
    ).all()

    if not active_sessions:
        return

    now = _now()
    for session in active_sessions:
        session.revoked_at = now


def _create_session(db: Session, user: User, request: Request) -> str:
    _revoke_active_sessions_for_user(db, user.id)
    session_token = secrets.token_urlsafe(48)
    db.add(
        UserSession(
            user_id=user.id,
            session_token_hash=_hash_session_token(session_token),
            expires_at=_build_session_expiry(),
            user_agent=request.headers.get("user-agent"),
            ip_address=_client_ip(request),
        )
    )
    db.flush()
    return session_token


def set_auth_cookie(response: Response, session_token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.session_ttl_seconds,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "status": user.status,
        "role": user.role,
        "createdAt": user.created_at,
    }


def _validate_register_payload(payload: AuthRegisterRequest) -> tuple[str, str]:
    username = payload.username.strip()
    email = _normalize_email(payload.email)

    next_errors: dict[str, str] = {}
    if not username:
        next_errors["username"] = "请先填写一个你想使用的用户名。"
    elif len(username) < 2:
        next_errors["username"] = "用户名至少保留 2 个字符。"

    if not email:
        next_errors["email"] = "请输入邮箱地址。"
    elif not re.match(EMAIL_PATTERN, email):
        next_errors["email"] = "这个邮箱格式看起来不太对，请再检查一下。"

    if not payload.password.strip():
        next_errors["password"] = "请设置登录密码。"
    elif len(payload.password) < 8:
        next_errors["password"] = "密码至少 8 位，安全性会更稳妥一些。"

    if not payload.confirmPassword.strip():
        next_errors["confirmPassword"] = "请再次输入一次密码。"
    elif payload.confirmPassword != payload.password:
        next_errors["confirmPassword"] = "两次输入的密码还不一致，请重新确认。"

    if not payload.agreed:
        next_errors["agreed"] = "注册前需要先勾选用户协议。"

    if next_errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=next_errors)

    return username, email


def _raise_duplicate_conflict(existing_user: User, username: str) -> None:
    if existing_user.username == username:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"username": "这个用户名已经被占用了。"})
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"email": "这个邮箱已经注册过账号了。"})


def register_user(db: Session, payload: AuthRegisterRequest, request: Request) -> AuthResult:
    username, email = _validate_register_payload(payload)

    existing_user = db.scalar(select(User).where(or_(User.username == username, User.email == email)))
    if existing_user:
        logger.info("register_conflict username=%s", username)
        _raise_duplicate_conflict(existing_user, username)

    try:
        user = User(
            username=username,
            email=email,
            password_hash=_hash_password(payload.password),
            agreed_terms_at=_now(),
            last_login_at=_now(),
        )
        db.add(user)
        db.flush()
        session_token = _create_session(db, user, request)
        db.commit()
        db.refresh(user)
        logger.info("register_success user_id=%s username=%s", user.id, user.username)
        return AuthResult(user=user, session_token=session_token)
    except IntegrityError as error:
        db.rollback()
        logger.warning("register_integrity_error username=%s error=%s", username, type(error).__name__)
        existing_user = db.scalar(select(User).where(or_(User.username == username, User.email == email)))
        if existing_user:
            _raise_duplicate_conflict(existing_user, username)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="注册信息冲突，请稍后重试。") from error
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("register_database_error username=%s", username)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="注册失败，请稍后重试。") from error


def login_user(db: Session, payload: AuthLoginRequest, request: Request) -> AuthResult:
    identifier = payload.identifier.strip()
    normalized_identifier = _normalize_email(identifier)

    if not identifier or not payload.password:
        logger.info("login_invalid_input")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail={"form": "请输入完整的登录信息。"})

    user = db.scalar(select(User).where(or_(User.username == identifier, User.email == normalized_identifier)))
    if not user or user.status != "active" or not _verify_password(payload.password, user.password_hash):
        logger.info("login_invalid_credentials")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS_DETAIL)

    try:
        user.last_login_at = _now()
        session_token = _create_session(db, user, request)
        db.commit()
        db.refresh(user)
        logger.info("login_success user_id=%s username=%s", user.id, user.username)
        return AuthResult(user=user, session_token=session_token)
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("login_database_error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="登录失败，请稍后重试。") from error


def revoke_session(db: Session, session_token: str) -> None:
    session = db.scalar(select(UserSession).where(UserSession.session_token_hash == _hash_session_token(session_token)))
    if not session or session.revoked_at is not None:
        return

    session.revoked_at = _now()
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("logout_revoke_failed")
        raise


def get_authenticated_user(db: Session, session_token: str | None) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=NOT_LOGGED_IN_DETAIL)

    session = db.scalar(select(UserSession).where(UserSession.session_token_hash == _hash_session_token(session_token)))
    expires_at = _coerce_utc(session.expires_at) if session else None
    revoked_at = _coerce_utc(session.revoked_at) if session else None
    if not session or revoked_at is not None or expires_at is None or expires_at <= _now():
        logger.info("session_invalid")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=SESSION_INVALID_DETAIL)

    user = db.get(User, session.user_id)
    if not user or user.status != "active":
        logger.info("session_user_inactive user_id=%s", session.user_id if session else None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=NOT_LOGGED_IN_DETAIL)
    return user


def current_user_dependency(
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    db: Session = Depends(get_db),
) -> User:
    return get_authenticated_user(db, session_token)


def current_admin_dependency(
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    db: Session = Depends(get_db),
) -> User:
    user = get_authenticated_user(db, session_token)
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return user
