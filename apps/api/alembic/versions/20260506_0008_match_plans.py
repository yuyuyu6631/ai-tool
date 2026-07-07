"""add match plans

Revision ID: 20260506_0008
Revises: 7127501bcdf6
Create Date: 2026-05-06 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260506_0008"
down_revision = "20260424_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "match_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=False),
        sa.Column("persona", sa.String(length=120), nullable=False),
        sa.Column("scenario", sa.String(length=160), nullable=False),
        sa.Column("trigger_keywords_json", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_match_plans_slug"), "match_plans", ["slug"], unique=True)
    op.create_index(op.f("ix_match_plans_persona"), "match_plans", ["persona"], unique=False)
    op.create_index(op.f("ix_match_plans_scenario"), "match_plans", ["scenario"], unique=False)
    op.create_index(op.f("ix_match_plans_status"), "match_plans", ["status"], unique=False)
    op.create_index(op.f("ix_match_plans_sort_order"), "match_plans", ["sort_order"], unique=False)

    op.create_table(
        "match_plan_tools",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("match_plan_id", sa.Integer(), nullable=False),
        sa.Column("tool_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["match_plan_id"], ["match_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tool_id"], ["tools.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("match_plan_id", "tool_id", name="uq_match_plan_tool"),
    )
    op.create_index(op.f("ix_match_plan_tools_match_plan_id"), "match_plan_tools", ["match_plan_id"], unique=False)
    op.create_index(op.f("ix_match_plan_tools_tool_id"), "match_plan_tools", ["tool_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_match_plan_tools_tool_id"), table_name="match_plan_tools")
    op.drop_index(op.f("ix_match_plan_tools_match_plan_id"), table_name="match_plan_tools")
    op.drop_table("match_plan_tools")
    op.drop_index(op.f("ix_match_plans_sort_order"), table_name="match_plans")
    op.drop_index(op.f("ix_match_plans_status"), table_name="match_plans")
    op.drop_index(op.f("ix_match_plans_scenario"), table_name="match_plans")
    op.drop_index(op.f("ix_match_plans_persona"), table_name="match_plans")
    op.drop_index(op.f("ix_match_plans_slug"), table_name="match_plans")
    op.drop_table("match_plans")
