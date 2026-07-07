import hashlib
import os
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_auth_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AUTH_SECRET_KEY", "test-auth-secret")
os.environ.setdefault("SESSION_COOKIE_NAME", "xingdianping_session")
os.environ.setdefault("COOKIE_SECURE", "false")

import app.db.session as session_mod  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import models  # noqa: E402, F401
from app.models.models import User, UserSession  # noqa: E402
from app.services import auth_service  # noqa: E402

app = create_app()


_test_engine = create_engine(
    f"sqlite:///{_TEST_DB_PATH}",
    connect_args={"check_same_thread": False},
)
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)
_ORIGINAL_SESSION_LOCAL = session_mod.SessionLocal


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    session_mod.SessionLocal = _TestSession
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    yield
    session_mod.SessionLocal = _ORIGINAL_SESSION_LOCAL
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists(_TEST_DB_PATH):
            os.remove(_TEST_DB_PATH)
    except PermissionError:
        pass


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _db_session() -> Session:
    return _TestSession()


def _count_users() -> int:
    with _db_session() as db:
        return db.scalar(select(func.count()).select_from(User)) or 0


def _has_error_for_field(detail: object, field: str) -> bool:
    if isinstance(detail, dict):
        return field in detail
    if isinstance(detail, list):
        return any(item.get("loc", [None])[-1] == field for item in detail if isinstance(item, dict))
    return False


def _register_payload(
    *,
    username: str = "demo-user",
    email: str = "Demo@Example.com",
    password: str = "password123",
    confirm_password: str | None = None,
    agreed: bool = True,
):
    return {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password if confirm_password is None else confirm_password,
        "agreed": agreed,
    }


def _register(client: TestClient, **overrides):
    return client.post("/api/auth/register", json=_register_payload(**overrides))


def _login(client: TestClient, identifier: str = "demo-user", password: str = "password123", **headers):
    return client.post(
        "/api/auth/login",
        json={"identifier": identifier, "password": password},
        headers=headers or None,
    )


def test_register_creates_user_and_session(client: TestClient):
    response = _register(client)

    assert response.status_code == 201
    payload = response.json()
    assert payload["username"] == "demo-user"
    assert payload["email"] == "demo@example.com"
    assert payload["status"] == "active"
    assert "password" not in payload
    assert "password_hash" not in payload
    assert auth_service.settings.session_cookie_name in response.cookies

    session_cookie = response.cookies[auth_service.settings.session_cookie_name]
    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        assert user is not None
        assert user.email == "demo@example.com"
        assert user.password_hash != "password123"
        assert auth_service.pwd_context.verify("password123", user.password_hash)
        assert user.agreed_terms_at is not None
        assert user.last_login_at is not None

        sessions = db.scalars(select(UserSession).where(UserSession.user_id == user.id)).all()
        assert len(sessions) == 1
        assert sessions[0].revoked_at is None
        assert sessions[0].session_token_hash == hashlib.sha256(session_cookie.encode("utf-8")).hexdigest()


def test_register_rejects_duplicate_username(client: TestClient):
    before_count = _count_users()
    response = _register(client, email="unique@example.com")
    after_count = _count_users()

    assert response.status_code == 409
    assert response.json()["detail"] == {"username": "这个用户名已经被占用了。"}
    assert after_count == before_count


def test_register_rejects_duplicate_email(client: TestClient):
    before_count = _count_users()
    response = _register(client, username="another-user", email="demo@example.com")
    after_count = _count_users()

    assert response.status_code == 409
    assert response.json()["detail"] == {"email": "这个邮箱已经注册过账号了。"}
    assert after_count == before_count


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"username": "a"}, "username"),
        ({"username": "   "}, "username"),
        ({"email": "invalid-email"}, "email"),
        ({"email": "   "}, "email"),
        ({"password": "1234567"}, "password"),
        ({"password": "        "}, "password"),
        ({"confirm_password": "password456"}, "confirmPassword"),
        ({"confirm_password": "        "}, "confirmPassword"),
        ({"agreed": False}, "agreed"),
    ],
)
def test_register_validation_errors_cover_required_auth_fields(client: TestClient, overrides: dict, field: str):
    response = _register(client, **overrides)

    assert response.status_code == 422
    assert _has_error_for_field(response.json()["detail"], field)


def test_register_rejects_password_longer_than_128_chars(client: TestClient):
    too_long_password = "p" * 129
    response = _register(client, username="long-pass-user", email="long-pass@example.com", password=too_long_password)

    assert response.status_code == 422


def test_register_accepts_password_length_boundaries(client: TestClient):
    exact_min = _register(
        client,
        username="eight-char-user",
        email="eight@example.com",
        password="12345678",
    )
    exact_max = _register(
        client,
        username="max-char-user",
        email="max@example.com",
        password="p" * 128,
    )

    assert exact_min.status_code == 201
    assert exact_max.status_code == 201


def test_register_normalizes_and_trims_username_and_email(client: TestClient):
    response = _register(
        client,
        username="  spaced-user  ",
        email="  MixedCase@Example.com  ",
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["username"] == "spaced-user"
    assert payload["email"] == "mixedcase@example.com"

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "spaced-user"))
        assert user is not None
        assert user.email == "mixedcase@example.com"


def test_register_conflict_uses_normalized_email(client: TestClient):
    response = _register(
        client,
        username="case-conflict-user",
        email="MiXeDcAsE@Example.com",
    )

    assert response.status_code == 409
    assert response.json()["detail"] == {"email": "这个邮箱已经注册过账号了。"}


def test_login_supports_username_and_email(client: TestClient):
    username_login = _login(client)
    assert username_login.status_code == 200
    assert username_login.json()["username"] == "demo-user"

    email_login = _login(client, identifier="demo@example.com")
    assert email_login.status_code == 200
    assert email_login.json()["email"] == "demo@example.com"


def test_login_rejects_wrong_password(client: TestClient):
    response = _login(client, password="wrong-password")

    assert response.status_code == 401
    assert response.json()["detail"] == auth_service.INVALID_CREDENTIALS_DETAIL


def test_login_rejects_unknown_user(client: TestClient):
    response = _login(client, identifier="missing-user")

    assert response.status_code == 401
    assert response.json()["detail"] == auth_service.INVALID_CREDENTIALS_DETAIL


def test_login_normalizes_email_and_trims_identifier(client: TestClient):
    email_login = _login(client, identifier="MIXEDCASE@example.com")
    trimmed_username_login = _login(client, identifier="  demo-user  ")

    assert email_login.status_code == 200
    assert trimmed_username_login.status_code == 200


def test_login_rejects_inactive_user(client: TestClient):
    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        user.status = "inactive"
        db.commit()

    response = _login(client)

    assert response.status_code == 401
    assert response.json()["detail"] == auth_service.INVALID_CREDENTIALS_DETAIL

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        user.status = "active"
        db.commit()


def test_login_parameter_validation_is_enforced(client: TestClient):
    short_identifier = client.post("/api/auth/login", json={"identifier": "a", "password": "password123"})
    blank_password = client.post("/api/auth/login", json={"identifier": "demo-user", "password": ""})

    assert short_identifier.status_code == 422
    assert blank_password.status_code == 422


def test_login_revokes_previous_active_sessions(client: TestClient):
    first_login = _login(client)
    assert first_login.status_code == 200

    second_login = _login(client)
    assert second_login.status_code == 200

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        sessions = db.scalars(select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.id.asc())).all()
        assert len(sessions) >= 2
        assert sessions[-1].revoked_at is None
        assert all(session.revoked_at is not None for session in sessions[:-1])


def test_login_updates_last_login_timestamp(client: TestClient):
    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        previous_login_at = user.last_login_at

    response = _login(client)
    assert response.status_code == 200

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        assert user.last_login_at is not None
        assert previous_login_at is None or user.last_login_at >= previous_login_at


def test_me_returns_current_user_with_valid_cookie(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "demo-user"
    assert "password_hash" not in me_response.json()


def test_me_requires_cookie(client: TestClient):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == auth_service.NOT_LOGGED_IN_DETAIL


def test_logout_revokes_session_and_future_me_is_unauthorized(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 204
    assert logout_response.headers["set-cookie"].startswith(f"{auth_service.settings.session_cookie_name}=")

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401


def test_logout_is_idempotent_without_valid_session(client: TestClient):
    response = client.post("/api/auth/logout")

    assert response.status_code == 204


def test_repeated_logout_is_idempotent(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200

    first_logout = client.post("/api/auth/logout")
    second_logout = client.post("/api/auth/logout")

    assert first_logout.status_code == 204
    assert second_logout.status_code == 204


def test_expired_session_is_not_usable(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200
    session_token = login_response.cookies.get(auth_service.settings.session_cookie_name)

    with _db_session() as db:
        session = db.scalar(select(UserSession).where(UserSession.session_token_hash.is_not(None)).order_by(UserSession.id.desc()))
        session.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        db.commit()

    client.cookies.set(auth_service.settings.session_cookie_name, session_token)
    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == auth_service.SESSION_INVALID_DETAIL


def test_revoked_session_is_not_usable(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200
    session_token = login_response.cookies.get(auth_service.settings.session_cookie_name)

    with _db_session() as db:
        session = db.scalar(select(UserSession).where(UserSession.session_token_hash.is_not(None)).order_by(UserSession.id.desc()))
        session.revoked_at = datetime.now(UTC)
        db.commit()

    client.cookies.set(auth_service.settings.session_cookie_name, session_token)
    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == auth_service.SESSION_INVALID_DETAIL


def test_tampered_session_cookie_is_not_usable(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200

    client.cookies.set(auth_service.settings.session_cookie_name, "tampered-session-token")
    me_response = client.get("/api/auth/me")

    assert me_response.status_code == 401
    assert me_response.json()["detail"] == auth_service.SESSION_INVALID_DETAIL


def test_me_rejects_inactive_user_even_with_valid_session(client: TestClient):
    login_response = _login(client)
    assert login_response.status_code == 200

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        user.status = "inactive"
        db.commit()

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == auth_service.NOT_LOGGED_IN_DETAIL

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        user.status = "active"
        db.commit()


def test_auth_cookie_sets_security_metadata_on_login(client: TestClient):
    response = _login(client)
    set_cookie = response.headers["set-cookie"]

    assert response.status_code == 200
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert "Max-Age=604800" in set_cookie
    assert "Path=/" in set_cookie
    assert "Secure" not in set_cookie


def test_logout_cookie_clear_preserves_path_and_samesite(client: TestClient):
    response = client.post("/api/auth/logout")
    set_cookie = response.headers["set-cookie"]

    assert response.status_code == 204
    assert "Path=/" in set_cookie
    assert "SameSite=lax" in set_cookie


def test_session_token_is_stored_hashed_not_plaintext(client: TestClient):
    response = _login(client)
    assert response.status_code == 200

    raw_token = response.cookies[auth_service.settings.session_cookie_name]
    with _db_session() as db:
        session = db.scalar(select(UserSession).order_by(UserSession.id.desc()))
        assert session.session_token_hash != raw_token
        assert session.session_token_hash == hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def test_register_records_user_agent_and_forwarded_ip(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json=_register_payload(username="ua-register-user", email="ua-register@example.com"),
        headers={"user-agent": "pytest-register-agent", "x-forwarded-for": "203.0.113.5, 10.0.0.1"},
    )

    assert response.status_code == 201

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "ua-register-user"))
        session = db.scalar(select(UserSession).where(UserSession.user_id == user.id))
        assert session.user_agent == "pytest-register-agent"
        assert session.ip_address == "203.0.113.5"


def test_login_records_user_agent_and_forwarded_ip(client: TestClient):
    response = _login(
        client,
        identifier="demo-user",
        password="password123",
        **{"user-agent": "pytest-login-agent", "x-forwarded-for": "198.51.100.10"},
    )

    assert response.status_code == 200

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "demo-user"))
        session = db.scalar(
            select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.id.desc())
        )
        assert session.user_agent == "pytest-login-agent"
        assert session.ip_address == "198.51.100.10"


def test_deleting_user_cascades_sessions(client: TestClient):
    response = _register(client, username="cascade-user", email="cascade@example.com")
    assert response.status_code == 201

    with _db_session() as db:
        user = db.scalar(select(User).where(User.username == "cascade-user"))
        session_count = db.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user.id))
        assert session_count == 1

        db.delete(user)
        db.commit()

        remaining_sessions = db.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user.id))
        assert remaining_sessions == 0
