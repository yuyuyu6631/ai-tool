"""add tool embeddings table"""

from alembic import op
import sqlalchemy as sa


revision = "20260408_0004"
down_revision = "7127501bcdf6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tool_embeddings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tool_id", sa.Integer(), sa.ForeignKey("tools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="stub"),
        sa.Column("model", sa.String(length=120), nullable=False, server_default="semantic-hash-v1"),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("embedding_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("tool_id"),
    )
    op.create_index("ix_tool_embeddings_tool_id", "tool_embeddings", ["tool_id"], unique=False)
    op.create_index("ix_tool_embeddings_content_hash", "tool_embeddings", ["content_hash"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_tool_embeddings_content_hash", table_name="tool_embeddings")
    op.drop_index("ix_tool_embeddings_tool_id", table_name="tool_embeddings")
    op.drop_table("tool_embeddings")
