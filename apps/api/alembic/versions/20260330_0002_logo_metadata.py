"""add logo metadata columns"""

from alembic import op
import sqlalchemy as sa


revision = "20260330_0002"
down_revision = "20260327_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tools", sa.Column("logo_status", sa.String(length=32), nullable=False, server_default="missing"))
    op.add_column("tools", sa.Column("logo_source", sa.String(length=32), nullable=False, server_default="imported"))
    op.execute(
        """
        UPDATE tools
        SET logo_status = CASE
            WHEN logo_path IS NULL OR TRIM(logo_path) = '' THEN 'missing'
            ELSE 'matched'
        END
        """
    )
    op.alter_column("tools", "logo_status", server_default=None)
    op.alter_column("tools", "logo_source", server_default=None)


def downgrade() -> None:
    op.drop_column("tools", "logo_source")
    op.drop_column("tools", "logo_status")
