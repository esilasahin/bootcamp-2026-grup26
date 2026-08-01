from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class QuizAnswer(BaseModel):
    question_id: str = Field(alias="questionId", min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=50)
    value: int = Field(ge=0, le=5)
    model_config = ConfigDict(populate_by_name=True)


class QuizQuestion(BaseModel):
    id: str
    text: str
    category: str
    min_value: int = Field(serialization_alias="minValue")
    max_value: int = Field(serialization_alias="maxValue")
    model_config = ConfigDict(populate_by_name=True)


class QuizSubmission(BaseModel):
    quiz_type: str = Field(default="career", alias="quizType", min_length=2, max_length=50)
    answers: list[QuizAnswer] = Field(min_length=1, max_length=100)
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("answers")
    @classmethod
    def unique_questions(cls, value: list[QuizAnswer]) -> list[QuizAnswer]:
        ids = [answer.question_id for answer in value]
        if len(ids) != len(set(ids)):
            raise ValueError("Aynı soru birden fazla kez cevaplanamaz.")
        return value


class QuizResultRead(BaseModel):
    id: int
    quiz_type: str = Field(serialization_alias="quizType")
    score: int
    total_questions: int = Field(serialization_alias="totalQuestions")
    category_scores: dict[str, int] = Field(serialization_alias="categoryScores")
    result_level: str = Field(serialization_alias="resultLevel")
    completed_at: datetime = Field(serialization_alias="completedAt")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CVAnalysisRead(BaseModel):
    id: int
    document_id: int = Field(serialization_alias="documentId")
    overall_score: int = Field(serialization_alias="overallScore")
    summary: str
    skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    experience_level: str = Field(serialization_alias="experienceLevel")
    created_at: datetime = Field(serialization_alias="createdAt")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class JobMatchRequest(BaseModel):
    job_title: str = Field(alias="jobTitle", min_length=2, max_length=150)
    job_description: str = Field(alias="jobDescription", min_length=20, max_length=30_000)
    cv_analysis_id: int | None = Field(default=None, alias="cvAnalysisId", gt=0)
    model_config = ConfigDict(populate_by_name=True)


class JobMatchRead(BaseModel):
    job_title: str = Field(serialization_alias="jobTitle")
    match_score: int = Field(serialization_alias="matchScore")
    matched_skills: list[str] = Field(serialization_alias="matchedSkills")
    missing_skills: list[str] = Field(serialization_alias="missingSkills")
    recommendation: str
    model_config = ConfigDict(populate_by_name=True)


class CoachRequest(BaseModel):
    target_role: str | None = Field(default=None, alias="targetRole", max_length=120)
    model_config = ConfigDict(populate_by_name=True)


class CoachRecommendationRead(BaseModel):
    id: int
    recommended_role: str = Field(serialization_alias="recommendedRole")
    summary: str
    recommendations: list[str]
    learning_path: list[str] = Field(serialization_alias="learningPath")
    priority_actions: list[str] = Field(serialization_alias="priorityActions")
    created_at: datetime = Field(serialization_alias="createdAt")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class HistoryItem(BaseModel):
    id: int
    type: str
    title: str
    summary: str
    created_at: datetime = Field(serialization_alias="createdAt")
    metadata: dict[str, Any] = Field(default_factory=dict)
    model_config = ConfigDict(populate_by_name=True)
