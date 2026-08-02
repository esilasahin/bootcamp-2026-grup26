"""Add generated study quizzes.

Revision ID: 0003_study_quizzes
Revises: 0002_sprint3_models
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_study_quizzes"
down_revision: Union[str, Sequence[str], None] = "0002_sprint3_models"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "study_quizzes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("topic", sa.String(length=200), nullable=False),
        sa.Column("questions", sa.JSON(), nullable=False),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_study_quizzes_user_id"),
        "study_quizzes",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_study_quizzes_user_id"), table_name="study_quizzes")
    op.drop_table("study_quizzes")
