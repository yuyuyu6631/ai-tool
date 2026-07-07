import os
from pathlib import Path
from shutil import rmtree
from tempfile import mkdtemp

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

_TEST_DIR = mkdtemp(prefix="embedding-backfill-")
_TEST_DB_PATH = os.path.join(_TEST_DIR, "test_backfill_tool_embeddings.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AI_PROVIDER", "stub")
os.environ.setdefault("EMBEDDING_PROVIDER", "stub")

import app.db.session as session_mod  # noqa: E402
from app.db.session import Base  # noqa: E402
from app.models.models import Tool, ToolEmbedding  # noqa: E402
from app.scripts import backfill_tool_embeddings  # noqa: E402
from app.services.seed_data import TOOLS  # noqa: E402


_test_engine = create_engine(
    f"sqlite:///{_TEST_DB_PATH}",
    connect_args={"check_same_thread": False},
)
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)
_ORIGINAL_SESSION_LOCAL = session_mod.SessionLocal
_ORIGINAL_BACKFILL_SESSION_LOCAL = backfill_tool_embeddings.SessionLocal


def setup_module():
    session_mod.SessionLocal = _TestSession
    backfill_tool_embeddings.SessionLocal = _TestSession
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)

    db = _TestSession()
    try:
        for tool in TOOLS[:3]:
            db.add(
                Tool(
                    slug=tool.slug,
                    name=tool.name,
                    category_name=tool.category,
                    summary=tool.summary,
                    description=tool.description,
                    editor_comment=tool.editorComment,
                    developer=tool.developer,
                    country=tool.country,
                    city=tool.city,
                    price=tool.price,
                    platforms=tool.platforms,
                    vpn_required=tool.vpnRequired,
                    official_url=tool.officialUrl,
                    logo_path=tool.logoPath,
                    logo_status=tool.logoStatus or "missing",
                    logo_source=tool.logoSource or "fallback",
                    score=tool.score,
                    status=tool.status,
                    featured=tool.featured,
                    created_on=tool.createdAt,
                    last_verified_at=tool.lastVerifiedAt,
                )
            )
        db.commit()
    finally:
        db.close()


def teardown_module():
    session_mod.SessionLocal = _ORIGINAL_SESSION_LOCAL
    backfill_tool_embeddings.SessionLocal = _ORIGINAL_BACKFILL_SESSION_LOCAL
    _test_engine.dispose()
    try:
        Path(_TEST_DB_PATH).unlink(missing_ok=True)
    finally:
        rmtree(_TEST_DIR, ignore_errors=True)


def test_backfill_tool_embeddings_is_idempotent():
    backfill_tool_embeddings.run()

    db = _TestSession()
    try:
        first_rows = db.scalars(select(ToolEmbedding).order_by(ToolEmbedding.tool_id)).all()
        first_count = db.scalar(select(func.count()).select_from(ToolEmbedding))
        first_hashes = {row.tool_id: row.content_hash for row in first_rows}
    finally:
        db.close()

    backfill_tool_embeddings.run()

    db = _TestSession()
    try:
        second_rows = db.scalars(select(ToolEmbedding).order_by(ToolEmbedding.tool_id)).all()
        second_count = db.scalar(select(func.count()).select_from(ToolEmbedding))
        second_hashes = {row.tool_id: row.content_hash for row in second_rows}
    finally:
        db.close()

    assert first_count == 3
    assert second_count == first_count
    assert len(first_hashes) == first_count
    assert len(second_hashes) == second_count
    assert second_hashes == first_hashes


def test_backfill_tool_embeddings_skips_single_dirty_row(monkeypatch):
    original_embed_text = backfill_tool_embeddings.embed_text

    def flaky_embed_text(text: str):
        if "Claude" in text:
            raise ValueError("bad row")
        return original_embed_text(text)

    monkeypatch.setattr(backfill_tool_embeddings, "embed_text", flaky_embed_text)

    db = _TestSession()
    try:
        db.query(ToolEmbedding).delete()
        db.commit()
    finally:
        db.close()

    backfill_tool_embeddings.run()

    db = _TestSession()
    try:
        rows = db.scalars(select(ToolEmbedding).order_by(ToolEmbedding.tool_id)).all()
    finally:
        db.close()

    assert len(rows) == 2
    assert {row.tool_id for row in rows} == {1, 3}
