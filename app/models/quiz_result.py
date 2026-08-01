from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quiz_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    answers: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    category_scores: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False, default=dict)
    result_level: Mapped[str] = mapped_column(String(30), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="quiz_results")
