"""add structured tool product elements"""

from alembic import op
import sqlalchemy as sa


revision = "20260424_0007"
down_revision = "20260417_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tools", sa.Column("features_json", sa.JSON(), nullable=True))
    op.add_column("tools", sa.Column("limitations_json", sa.JSON(), nullable=True))
    op.add_column("tools", sa.Column("best_for_json", sa.JSON(), nullable=True))
    op.add_column("tools", sa.Column("deal_summary", sa.String(length=255), nullable=False, server_default=""))
    op.add_column("tools", sa.Column("media_items_json", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("tools", "media_items_json")
    op.drop_column("tools", "deal_summary")
    op.drop_column("tools", "best_for_json")
    op.drop_column("tools", "limitations_json")
    op.drop_column("tools", "features_json")
