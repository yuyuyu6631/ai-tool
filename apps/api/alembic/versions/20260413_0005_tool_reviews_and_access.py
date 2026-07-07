"""add tool reviews, access flags, and structured pricing"""

from alembic import op
import sqlalchemy as sa


revision = "20260413_0005"
down_revision = "20260408_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tools", sa.Column("access_flags", sa.JSON(), nullable=True))
    op.add_column("tools", sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tools", sa.Column("pricing_type", sa.String(length=32), nullable=False, server_default="unknown"))
    op.add_column("tools", sa.Column("price_min_cny", sa.Integer(), nullable=True))
    op.add_column("tools", sa.Column("price_max_cny", sa.Integer(), nullable=True))
    op.add_column("tools", sa.Column("free_allowance_text", sa.String(length=255), nullable=False, server_default=""))

    op.create_table(
        "tool_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tool_id", sa.Integer(), sa.ForeignKey("tools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_type", sa.String(length=16), nullable=False, server_default="editor"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("pitfalls_json", sa.JSON(), nullable=True),
        sa.Column("pros_json", sa.JSON(), nullable=True),
        sa.Column("cons_json", sa.JSON(), nullable=True),
        sa.Column("audience", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("task", sa.String(length=160), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_tool_reviews_tool_id", "tool_reviews", ["tool_id"], unique=False)
    op.create_index("ix_tool_reviews_user_id", "tool_reviews", ["user_id"], unique=False)
    op.create_index("ix_tool_reviews_source_type", "tool_reviews", ["source_type"], unique=False)
    op.create_index("ix_tool_reviews_status", "tool_reviews", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_tool_reviews_status", table_name="tool_reviews")
    op.drop_index("ix_tool_reviews_source_type", table_name="tool_reviews")
    op.drop_index("ix_tool_reviews_user_id", table_name="tool_reviews")
    op.drop_index("ix_tool_reviews_tool_id", table_name="tool_reviews")
    op.drop_table("tool_reviews")

    op.drop_column("tools", "free_allowance_text")
    op.drop_column("tools", "price_max_cny")
    op.drop_column("tools", "price_min_cny")
    op.drop_column("tools", "pricing_type")
    op.drop_column("tools", "review_count")
    op.drop_column("tools", "access_flags")
