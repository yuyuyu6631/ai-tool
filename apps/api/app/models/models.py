from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
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
    official_url: Mapped[str] = mapped_column(String(255))
    logo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_status: Mapped[str] = mapped_column(String(32), default="missing")
    logo_source: Mapped[str] = mapped_column(String(32), default="imported")
    score: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="published")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_on: Mapped[date] = mapped_column(Date)
    last_verified_at: Mapped[date] = mapped_column(Date)

    tags: Mapped[list["ToolTag"]] = relationship(back_populates="tool", cascade="all, delete-orphan")
    categories: Mapped[list["ToolCategory"]] = relationship(back_populates="tool", cascade="all, delete-orphan")


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
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))

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
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"))
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"))

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
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"))
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)


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
    ranking_id: Mapped[int] = mapped_column(ForeignKey("rankings.id", ondelete="CASCADE"))
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"))
    rank_order: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(255))


class Source(Base, TimestampMixin):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int | None] = mapped_column(ForeignKey("tools.id", ondelete="SET NULL"), nullable=True)
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
    crawl_job_id: Mapped[int | None] = mapped_column(ForeignKey("crawl_jobs.id", ondelete="SET NULL"), nullable=True)
    tool_slug: Mapped[str] = mapped_column(String(120))
    raw_payload: Mapped[str] = mapped_column(Text)
    parsed_payload: Mapped[str] = mapped_column(Text)
    diff_summary: Mapped[str | None] = mapped_column(Text, nullable=True)


class ToolUpdate(Base, TimestampMixin):
    __tablename__ = "tool_updates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(32), default="pending_review")
    proposed_payload: Mapped[str] = mapped_column(Text)
    reviewer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
