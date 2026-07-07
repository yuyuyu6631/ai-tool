from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import User
from app.services.auth_service import pwd_context


DEV_ADMIN_USERNAME = "admin"
DEV_ADMIN_PASSWORD = "admin123"
DEV_ADMIN_EMAIL = "admin@xingdianping.local"


def ensure_admin_user(db: Session, *, username: str, password: str, email: str) -> User:
    """Ensure a configured admin account is usable."""
    now = datetime.now(UTC)
    username = username.strip()
    password = password.strip()
    email = email.strip().lower()
    if not username:
        raise ValueError("admin username must not be empty")
    if not password:
        raise ValueError("admin password must not be empty")
    if not email:
        raise ValueError("admin email must not be empty")

    user = db.scalar(select(User).where(User.username == username))

    if user is None:
        existing_email_owner = db.scalar(select(User).where(User.email == email))
        if existing_email_owner is not None:
            email = f"{username}+admin@xingdianping.local"

        user = User(
            username=username,
            email=email,
            password_hash=pwd_context.hash(password),
            status="active",
            role="admin",
            agreed_terms_at=now,
            last_login_at=None,
        )
        db.add(user)
        db.flush()
        return user

    changed = False
    if user.status != "active":
        user.status = "active"
        changed = True
    if user.role != "admin":
        user.role = "admin"
        changed = True
    if not pwd_context.verify(password, user.password_hash):
        user.password_hash = pwd_context.hash(password)
        changed = True
    if user.agreed_terms_at is None:
        user.agreed_terms_at = now
        changed = True

    if changed:
        db.flush()

    return user


def ensure_dev_admin_user(db: Session) -> User:
    """Ensure the local development admin account is usable."""
    return ensure_admin_user(
        db,
        username=DEV_ADMIN_USERNAME,
        password=DEV_ADMIN_PASSWORD,
        email=DEV_ADMIN_EMAIL,
    )
