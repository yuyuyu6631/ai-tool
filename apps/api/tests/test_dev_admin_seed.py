import os
from datetime import UTC, datetime

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_dev_admin_seed.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AUTH_SECRET_KEY", "test-auth-secret")

from app.db.session import Base  # noqa: E402
from app.models import models  # noqa: F401,E402
from app.models.models import User  # noqa: E402
from app.services.auth_service import pwd_context  # noqa: E402
from app.services.dev_admin_seed import (  # noqa: E402
    DEV_ADMIN_EMAIL,
    DEV_ADMIN_PASSWORD,
    DEV_ADMIN_USERNAME,
    ensure_admin_user,
    ensure_dev_admin_user,
)


_test_engine = create_engine(
    f"sqlite:///{_TEST_DB_PATH}",
    connect_args={"check_same_thread": False},
)
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)


def setup_function():
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)


def teardown_module():
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists(_TEST_DB_PATH):
            os.remove(_TEST_DB_PATH)
    except PermissionError:
        pass


def test_ensure_dev_admin_user_creates_login_account():
    with _TestSession() as db:
        user = ensure_dev_admin_user(db)
        db.commit()

    with _TestSession() as db:
        user = db.scalar(select(User).where(User.username == DEV_ADMIN_USERNAME))
        assert user is not None
        assert user.email == DEV_ADMIN_EMAIL
        assert user.status == "active"
        assert user.role == "admin"
        assert pwd_context.verify(DEV_ADMIN_PASSWORD, user.password_hash)


def test_ensure_dev_admin_user_repairs_existing_account():
    with _TestSession() as db:
        db.add(
            User(
                username=DEV_ADMIN_USERNAME,
                email=DEV_ADMIN_EMAIL,
                password_hash=pwd_context.hash("old-password"),
                status="inactive",
                role="user",
                agreed_terms_at=datetime.now(UTC),
            )
        )
        db.commit()

    with _TestSession() as db:
        ensure_dev_admin_user(db)
        db.commit()

    with _TestSession() as db:
        user = db.scalar(select(User).where(User.username == DEV_ADMIN_USERNAME))
        assert user is not None
        assert user.status == "active"
        assert user.role == "admin"
        assert pwd_context.verify(DEV_ADMIN_PASSWORD, user.password_hash)


def test_ensure_admin_user_supports_configured_credentials():
    with _TestSession() as db:
        user = ensure_admin_user(
            db,
            username="ops",
            password="ops-password-123",
            email="ops@example.com",
        )
        db.commit()

    with _TestSession() as db:
        user = db.scalar(select(User).where(User.username == "ops"))
        assert user is not None
        assert user.email == "ops@example.com"
        assert user.status == "active"
        assert user.role == "admin"
        assert pwd_context.verify("ops-password-123", user.password_hash)
