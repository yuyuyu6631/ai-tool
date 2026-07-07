"""add structured import metadata fields to tools"""

from alembic import op
import sqlalchemy as sa


revision = "20260331_0002"
down_revision = "20260327_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tools", sa.Column("developer", sa.String(length=255), nullable=False, server_default=""))
    op.add_column("tools", sa.Column("country", sa.String(length=64), nullable=False, server_default=""))
    op.add_column("tools", sa.Column("city", sa.String(length=120), nullable=False, server_default=""))
    op.add_column("tools", sa.Column("price", sa.String(length=64), nullable=False, server_default=""))
    op.add_column("tools", sa.Column("platforms", sa.String(length=255), nullable=False, server_default=""))
    op.add_column("tools", sa.Column("vpn_required", sa.String(length=32), nullable=False, server_default=""))

    op.execute(
        sa.text(
            """
            UPDATE tools
            SET
              developer = CASE
                WHEN editor_comment REGEXP 'Developer:[[:space:]]*[^|]+' THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(editor_comment, 'Developer:', -1), '|', 1))
                ELSE developer
              END,
              country = CASE
                WHEN editor_comment REGEXP 'Country:[[:space:]]*[^|]+' THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(editor_comment, 'Country:', -1), '|', 1))
                ELSE country
              END,
              city = CASE
                WHEN editor_comment REGEXP 'City:[[:space:]]*[^|]+' THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(editor_comment, 'City:', -1), '|', 1))
                ELSE city
              END,
              price = CASE
                WHEN editor_comment REGEXP 'Price:[[:space:]]*[^|]+' THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(editor_comment, 'Price:', -1), '|', 1))
                ELSE price
              END,
              platforms = CASE
                WHEN editor_comment REGEXP 'Platforms:[[:space:]]*[^|]+' THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(editor_comment, 'Platforms:', -1), '|', 1))
                ELSE platforms
              END,
              vpn_required = CASE
                WHEN editor_comment REGEXP 'VPN required:[[:space:]]*[^|]+' THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(editor_comment, 'VPN required:', -1), '|', 1))
                ELSE vpn_required
              END
            """
        )
    )


def downgrade() -> None:
    op.drop_column("tools", "vpn_required")
    op.drop_column("tools", "platforms")
    op.drop_column("tools", "price")
    op.drop_column("tools", "city")
    op.drop_column("tools", "country")
    op.drop_column("tools", "developer")
