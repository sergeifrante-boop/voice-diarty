"""Add insights table and word_count to entries

Revision ID: 0003_add_insights_and_word_count
Revises: 0002_add_audio_key
Create Date: 2025-11-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_add_insights_and_word_count"
down_revision = "0002_add_audio_key"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("entries", sa.Column("word_count", sa.Integer(), nullable=True))
    
    op.create_table(
        "insights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(length=16), nullable=False),
        sa.Column("source_entry_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("period_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("period_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("timeframe", sa.String(length=16), nullable=True),
        sa.Column("language", sa.String(length=8), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("meta", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_entry_id"], ["entries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_insights_id"), "insights", ["id"], unique=False)
    op.create_index(op.f("ix_insights_user_id"), "insights", ["user_id"], unique=False)
    op.create_index(op.f("ix_insights_created_at"), "insights", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_insights_created_at"), table_name="insights")
    op.drop_index(op.f("ix_insights_user_id"), table_name="insights")
    op.drop_index(op.f("ix_insights_id"), table_name="insights")
    op.drop_table("insights")
    op.drop_column("entries", "word_count")
