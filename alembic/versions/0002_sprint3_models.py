"""Add Sprint 3 CV, quiz and coach models.

Revision ID: 0002_sprint3_models
Revises: 0001_initial
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_sprint3_models"
down_revision: Union[str, Sequence[str], None] = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("cv_analyses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False), sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("overall_score", sa.Integer(), nullable=False), sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("skills", sa.JSON(), nullable=False), sa.Column("strengths", sa.JSON(), nullable=False),
        sa.Column("weaknesses", sa.JSON(), nullable=False), sa.Column("recommendations", sa.JSON(), nullable=False),
        sa.Column("experience_level", sa.String(30), nullable=False), sa.Column("analysis_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index(op.f("ix_cv_analyses_user_id"), "cv_analyses", ["user_id"])
    op.create_index(op.f("ix_cv_analyses_document_id"), "cv_analyses", ["document_id"])
    op.create_table("quiz_results",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False), sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("quiz_type", sa.String(50), nullable=False), sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False), sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("category_scores", sa.JSON(), nullable=False), sa.Column("result_level", sa.String(30), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index(op.f("ix_quiz_results_user_id"), "quiz_results", ["user_id"])
    op.create_index(op.f("ix_quiz_results_quiz_type"), "quiz_results", ["quiz_type"])
    op.create_table("coach_recommendations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False), sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recommended_role", sa.String(120), nullable=False), sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("recommendations", sa.JSON(), nullable=False), sa.Column("learning_path", sa.JSON(), nullable=False),
        sa.Column("priority_actions", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index(op.f("ix_coach_recommendations_user_id"), "coach_recommendations", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_coach_recommendations_user_id"), table_name="coach_recommendations")
    op.drop_table("coach_recommendations")
    op.drop_index(op.f("ix_quiz_results_quiz_type"), table_name="quiz_results")
    op.drop_index(op.f("ix_quiz_results_user_id"), table_name="quiz_results")
    op.drop_table("quiz_results")
    op.drop_index(op.f("ix_cv_analyses_document_id"), table_name="cv_analyses")
    op.drop_index(op.f("ix_cv_analyses_user_id"), table_name="cv_analyses")
    op.drop_table("cv_analyses")
