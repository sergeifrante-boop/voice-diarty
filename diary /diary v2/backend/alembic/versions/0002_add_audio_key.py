"""Add audio key column

Revision ID: 0002_add_audio_key
Revises: 0001_initial
Create Date: 2025-11-20
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_audio_key"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("entries", sa.Column("audio_key", sa.String(length=512), nullable=True))
    op.execute("UPDATE entries SET audio_key = audio_url")
    op.alter_column("entries", "audio_key", nullable=False)


def downgrade() -> None:
    op.drop_column("entries", "audio_key")
