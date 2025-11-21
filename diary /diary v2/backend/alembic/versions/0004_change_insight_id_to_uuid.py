"""Change insight id from Integer to UUID

Revision ID: 0004_change_insight_id_to_uuid
Revises: 0003_add_insights_and_word_count
Create Date: 2025-01-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_change_insight_id_to_uuid"
down_revision = "0003_add_insights_and_word_count"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Drop the existing primary key constraint and index
    op.drop_constraint("insights_pkey", "insights", type_="primary")
    op.drop_index("ix_insights_id", table_name="insights")
    
    # Step 2: Add new UUID column (nullable initially)
    op.add_column("insights", sa.Column("id_new", postgresql.UUID(as_uuid=True), nullable=True))
    
    # Step 3: Generate UUIDs for existing rows (if any)
    op.execute("UPDATE insights SET id_new = gen_random_uuid()")
    
    # Step 4: Make the new column not nullable
    op.alter_column("insights", "id_new", nullable=False)
    
    # Step 5: Drop the old integer column
    op.drop_column("insights", "id")
    
    # Step 6: Rename the new column to id
    op.alter_column("insights", "id_new", new_column_name="id")
    
    # Step 7: Add primary key constraint and index
    op.create_primary_key("insights_pkey", "insights", ["id"])
    op.create_index("ix_insights_id", "insights", ["id"], unique=False)


def downgrade() -> None:
    # Reverse the process
    op.drop_constraint("insights_pkey", "insights", type_="primary")
    op.drop_index("ix_insights_id", table_name="insights")
    
    # Add integer column back
    op.add_column("insights", sa.Column("id_old", sa.Integer(), nullable=True, autoincrement=True))
    
    # Generate sequential IDs (this is a simplified approach - in production you'd want to preserve original IDs if possible)
    op.execute("""
        WITH numbered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
            FROM insights
        )
        UPDATE insights
        SET id_old = numbered.rn
        FROM numbered
        WHERE insights.id = numbered.id
    """)
    
    op.alter_column("insights", "id_old", nullable=False)
    op.drop_column("insights", "id")
    op.alter_column("insights", "id_old", new_column_name="id")
    op.create_primary_key("insights_pkey", "insights", ["id"])
    op.create_index("ix_insights_id", "insights", ["id"], unique=False)

