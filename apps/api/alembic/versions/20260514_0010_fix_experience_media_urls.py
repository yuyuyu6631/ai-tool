"""fix experience media urls

Revision ID: 20260514_0010
Revises: 20260514_0009
Create Date: 2026-05-14 12:30:00.000000
"""

from __future__ import annotations

from alembic import op


revision = "20260514_0010"
down_revision = "20260514_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE experience_posts
        SET cover_image_url = '/logos/_Cosine Genie.png'
        WHERE cover_image_url = '/logos/Cosine Genie.png'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE experience_posts
        SET cover_image_url = '/logos/Cosine Genie.png'
        WHERE cover_image_url = '/logos/_Cosine Genie.png'
          AND slug = 'hammers-agent-tool-stack'
        """
    )
