from pydantic import BaseModel, ConfigDict, Field, model_validator


class GeneratedQuizQuestion(BaseModel):
    question: str = Field(min_length=5, max_length=500)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str = Field(min_length=5, max_length=1_000)


class GeneratedQuizContent(BaseModel):
    questions: list[GeneratedQuizQuestion]


class StudyQuizGenerateRequest(BaseModel):
    topic: str | None = Field(default=None, min_length=2, max_length=200)
    document_id: int | None = Field(default=None, alias="documentId", gt=0)
    question_count: int = Field(default=3, alias="questionCount")

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_source_and_count(self) -> "StudyQuizGenerateRequest":
        if not self.topic and self.document_id is None:
            raise ValueError("Quiz için konu veya belge seçilmelidir.")
        if self.question_count not in {3, 5, 10}:
            raise ValueError("Soru sayısı 3, 5 veya 10 olmalıdır.")
        return self


class StudyQuizQuestionRead(BaseModel):
    id: str
    question: str
    options: list[str]


class StudyQuizRead(BaseModel):
    quiz_id: int = Field(serialization_alias="quizId")
    topic: str = Field(serialization_alias="konu")
    questions: list[StudyQuizQuestionRead]

    model_config = ConfigDict(populate_by_name=True)


class StudyQuizSubmitRequest(BaseModel):
    quiz_id: int = Field(alias="quizId", gt=0)
    answers: list[int] = Field(min_length=1, max_length=10)

    model_config = ConfigDict(populate_by_name=True)


class StudyQuizReviewItem(BaseModel):
    question_id: str = Field(serialization_alias="questionId")
    selected_index: int = Field(serialization_alias="selectedIndex")
    correct_index: int = Field(serialization_alias="correctIndex")
    is_correct: bool = Field(serialization_alias="isCorrect")
    explanation: str

    model_config = ConfigDict(populate_by_name=True)


class StudyQuizResultRead(BaseModel):
    result_id: int = Field(serialization_alias="resultId")
    score: int
    correct: int
    total: int
    result_level: str = Field(serialization_alias="resultLevel")
    review: list[StudyQuizReviewItem]

    model_config = ConfigDict(populate_by_name=True)
