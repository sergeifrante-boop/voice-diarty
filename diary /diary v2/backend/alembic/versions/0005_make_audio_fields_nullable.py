"""Make audio_key and audio_url nullable

Revision ID: 0005_make_audio_fields_nullable
Revises: 0004_change_insight_id_to_uuid
Create Date: 2025-01-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_make_audio_fields_nullable"
down_revision = "0004_change_insight_id_to_uuid"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make audio_key nullable
    op.alter_column("entries", "audio_key", nullable=True, existing_type=sa.String(512))
    
    # Make audio_url nullable
    op.alter_column("entries", "audio_url", nullable=True, existing_type=sa.String(512))


def downgrade() -> None:
    # Set default values for NULL entries before making non-nullable
    op.execute("UPDATE entries SET audio_key = '' WHERE audio_key IS NULL")
    op.execute("UPDATE entries SET audio_url = '' WHERE audio_url IS NULL")
    
    # Make audio_key not nullable
    op.alter_column("entries", "audio_key", nullable=False, existing_type=sa.String(512))
    
    # Make audio_url not nullable
    op.alter_column("entries", "audio_url", nullable=False, existing_type=sa.String(512))

