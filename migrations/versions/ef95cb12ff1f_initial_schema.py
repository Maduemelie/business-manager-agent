"""initial_schema

Revision ID: ef95cb12ff1f
Revises: 
Create Date: 2026-07-28 11:39:51.688041

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef95cb12ff1f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        CREATE TABLE IF NOT EXISTS perfumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_filename TEXT,
            perfume_name TEXT,
            brand TEXT,
            description TEXT,
            scent_profile TEXT,
            longevity TEXT,
            best_for TEXT,
            category TEXT,
            image_generation_prompt TEXT
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS selection_history (
            perfume_id INTEGER PRIMARY KEY,
            selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('selection_history')
    op.drop_table('perfumes')
