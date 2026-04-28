from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


class Tool(Base, TimestampMixin):
    __tablename__ = "tools"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    category_name: Mapped[str] = mapped_column(String(120), index=True)
    summary: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text)
    editor_comment: Mapped[str] = mapped_column(Text)
    developer: Mapped[str] = mapped_column(String(255), default="")
    country: Mapped[str] = mapped_column(String(64), default="")
    city: Mapped[str] = mapped_column(String(120), default="")
    price: Mapped[str] = mapped_column(String(64), default="")
    platforms: Mapped[str] = mapped_column(String(255), default="")
    vpn_required: Mapped[str] = mapped_column(String(32), default="")
    access_flags: Mapped[dict[str, bool | None] | None] = mapped_column(JSON, nullable=True)
    official_url: Mapped[str] = mapped_column(String(255))
    logo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_status: Mapped[str] = mapped_column(String(32), default="missing")
    logo_source: Mapped[str] = mapped_column(String(32), default="imported")
    score: Mapped[float] = mapped_column(Float, index=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="published", index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    pricing_type: Mapped[str] = mapped_column(String(32), default="unknown")
    price_min_cny: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_max_cny: Mapped[int | None] = mapped_column(Integer, nullable=True)
    free_allowance_text: Mapped[str] = mapped_column(String(255), default="")
    features_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    limitations_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    best_for_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    deal_summary: Mapped[str] = mapped_column(String(255), default="")
    media_items_json: Mapped[list[dict[str, str]] | None] = mapped_column(JSON, nullable=True)
    created_on: Mapped[date] = mapped_column(Date, index=True)
    last_verified_at: Mapped[date] = mapped_column(Date)

    tags: Mapped[list["ToolTag"]] = relationship(back_populates="tool", cascade="all, delete-orphan")
    categories: Mapped[list["ToolCategory"]] = relationship(back_populates="tool", cascade="all, delete-orphan")
    reviews: Mapped[list["ToolReview"]] = relationship(back_populates="tool", cascade="all, delete-orphan")


class ToolEmbedding(Base, TimestampMixin):
    __tablename__ = "tool_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(32), default="stub")
    model: Mapped[str] = mapped_column(String(120), default="semantic-hash-v1")
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    source_text: Mapped[str] = mapped_column(Text)
    embedding_json: Mapped[str] = mapped_column(Text)


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str] = mapped_column(String(255))

    tools: Mapped[list["ToolCategory"]] = relationship(back_populates="category", cascade="all, delete-orphan")


class ToolCategory(Base):
    __tablename__ = "tool_categories"
    __table_args__ = (UniqueConstraint("tool_id", "category_id", name="uq_tool_category"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)

    tool: Mapped["Tool"] = relationship(back_populates="categories")
    category: Mapped["Category"] = relationship(back_populates="tools")


class Tag(Base, TimestampMixin):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)

    tools: Mapped[list["ToolTag"]] = relationship(back_populates="tag", cascade="all, delete-orphan")


class ToolTag(Base):
    __tablename__ = "tool_tags"
    __table_args__ = (UniqueConstraint("tool_id", "tag_id", name="uq_tool_tag"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), index=True)

    tool: Mapped["Tool"] = relationship(back_populates="tags")
    tag: Mapped["Tag"] = relationship(back_populates="tools")


class Scenario(Base, TimestampMixin):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(String(512))
    problem: Mapped[str] = mapped_column(Text)
    tool_count: Mapped[int] = mapped_column(Integer, default=0)


class ScenarioTool(Base):
    __tablename__ = "scenario_tools"
    __table_args__ = (UniqueConstraint("scenario_id", "tool_id", name="uq_scenario_tool"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), index=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)

    tool: Mapped["Tool"] = relationship()


class Ranking(Base, TimestampMixin):
    __tablename__ = "rankings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(String(512))


class RankingItem(Base):
    __tablename__ = "ranking_items"
    __table_args__ = (UniqueConstraint("ranking_id", "tool_id", name="uq_ranking_tool"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ranking_id: Mapped[int] = mapped_column(ForeignKey("rankings.id", ondelete="CASCADE"), index=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    rank_order: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(255))

    tool: Mapped["Tool"] = relationship()


class Source(Base, TimestampMixin):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int | None] = mapped_column(ForeignKey("tools.id", ondelete="SET NULL"), nullable=True, index=True)
    source_type: Mapped[str] = mapped_column(String(64))
    source_url: Mapped[str] = mapped_column(String(255))


class CrawlJob(Base, TimestampMixin):
    __tablename__ = "crawl_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_name: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class CrawlSnapshot(Base, TimestampMixin):
    __tablename__ = "crawl_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    crawl_job_id: Mapped[int | None] = mapped_column(ForeignKey("crawl_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    tool_slug: Mapped[str] = mapped_column(String(120))
    raw_payload: Mapped[str] = mapped_column(Text)
    parsed_payload: Mapped[str] = mapped_column(Text)
    diff_summary: Mapped[str | None] = mapped_column(Text, nullable=True)


class ToolUpdate(Base, TimestampMixin):
    __tablename__ = "tool_updates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending_review")
    proposed_payload: Mapped[str] = mapped_column(Text)
    reviewer_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class ToolReview(Base, TimestampMixin):
    __tablename__ = "tool_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    source_type: Mapped[str] = mapped_column(String(16), default="editor", index=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    pitfalls_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    pros_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    cons_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    audience: Mapped[str] = mapped_column(String(120), default="")
    task: Mapped[str] = mapped_column(String(160), default="")

    tool: Mapped["Tool"] = relationship(back_populates="reviews")
    user: Mapped["User | None"] = relationship()


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default="active")
    role: Mapped[str] = mapped_column(String(32), default="user")
    agreed_terms_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSession(Base, TimestampMixin):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)

    user: Mapped["User"] = relationship(back_populates="sessions")
