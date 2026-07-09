"""add user roles and review uniqueness"""

import sqlalchemy as sa

from alembic import op

revision = "20260417_0006"
down_revision = "20260413_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("role", sa.String(length=32), nullable=False, server_default="user")
    )
    op.create_index("ix_users_role", "users", ["role"], unique=False)
    with op.batch_alter_table("tool_reviews") as batch_op:
        batch_op.create_unique_constraint("uq_tool_review_user", ["tool_id", "user_id"])


def downgrade() -> None:
    with op.batch_alter_table("tool_reviews") as batch_op:
        batch_op.drop_constraint("uq_tool_review_user", type_="unique")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "role")
