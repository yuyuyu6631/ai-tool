"""add experience community interactions

Revision ID: 20260514_0009
Revises: 20260506_0008
Create Date: 2026-05-14 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260514_0009"
down_revision = "20260506_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "experience_boards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=False),
        sa.Column("accent", sa.String(length=32), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_experience_boards_slug"), "experience_boards", ["slug"], unique=True)
    op.create_index(op.f("ix_experience_boards_sort_order"), "experience_boards", ["sort_order"], unique=False)

    op.create_table(
        "experience_posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.String(length=512), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("channel", sa.String(length=80), nullable=False),
        sa.Column("board_id", sa.Integer(), nullable=True),
        sa.Column("scenario", sa.String(length=160), nullable=False),
        sa.Column("tools_json", sa.JSON(), nullable=True),
        sa.Column("roles_json", sa.JSON(), nullable=True),
        sa.Column("cover_image_url", sa.String(length=512), nullable=False),
        sa.Column("image_urls_json", sa.JSON(), nullable=True),
        sa.Column("author_name", sa.String(length=120), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("view_count", sa.Integer(), nullable=False),
        sa.Column("like_count", sa.Integer(), nullable=False),
        sa.Column("favorite_count", sa.Integer(), nullable=False),
        sa.Column("comment_count", sa.Integer(), nullable=False),
        sa.Column("is_official", sa.Boolean(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["board_id"], ["experience_boards.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_experience_posts_slug"), "experience_posts", ["slug"], unique=True)
    op.create_index(op.f("ix_experience_posts_channel"), "experience_posts", ["channel"], unique=False)
    op.create_index(op.f("ix_experience_posts_board_id"), "experience_posts", ["board_id"], unique=False)
    op.create_index(op.f("ix_experience_posts_scenario"), "experience_posts", ["scenario"], unique=False)
    op.create_index(op.f("ix_experience_posts_author_id"), "experience_posts", ["author_id"], unique=False)
    op.create_index(op.f("ix_experience_posts_status"), "experience_posts", ["status"], unique=False)
    op.create_index(op.f("ix_experience_posts_published_at"), "experience_posts", ["published_at"], unique=False)

    op.create_table(
        "experience_comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(length=512), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("like_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["experience_comments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["post_id"], ["experience_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_experience_comments_post_id"), "experience_comments", ["post_id"], unique=False)
    op.create_index(op.f("ix_experience_comments_user_id"), "experience_comments", ["user_id"], unique=False)
    op.create_index(op.f("ix_experience_comments_parent_id"), "experience_comments", ["parent_id"], unique=False)
    op.create_index(op.f("ix_experience_comments_status"), "experience_comments", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_experience_comments_status"), table_name="experience_comments")
    op.drop_index(op.f("ix_experience_comments_parent_id"), table_name="experience_comments")
    op.drop_index(op.f("ix_experience_comments_user_id"), table_name="experience_comments")
    op.drop_index(op.f("ix_experience_comments_post_id"), table_name="experience_comments")
    op.drop_table("experience_comments")
    op.drop_index(op.f("ix_experience_posts_published_at"), table_name="experience_posts")
    op.drop_index(op.f("ix_experience_posts_status"), table_name="experience_posts")
    op.drop_index(op.f("ix_experience_posts_author_id"), table_name="experience_posts")
    op.drop_index(op.f("ix_experience_posts_scenario"), table_name="experience_posts")
    op.drop_index(op.f("ix_experience_posts_board_id"), table_name="experience_posts")
    op.drop_index(op.f("ix_experience_posts_channel"), table_name="experience_posts")
    op.drop_index(op.f("ix_experience_posts_slug"), table_name="experience_posts")
    op.drop_table("experience_posts")
    op.drop_index(op.f("ix_experience_boards_sort_order"), table_name="experience_boards")
    op.drop_index(op.f("ix_experience_boards_slug"), table_name="experience_boards")
    op.drop_table("experience_boards")
