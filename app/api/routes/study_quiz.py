from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import settings
from app.models.document import Document
from app.models.quiz_result import QuizResult
from app.models.study_quiz import StudyQuiz
from app.schemas.common import ApiResponse
from app.schemas.study_quiz import (
    StudyQuizGenerateRequest,
    StudyQuizQuestionRead,
    StudyQuizRead,
    StudyQuizResultRead,
    StudyQuizReviewItem,
    StudyQuizSubmitRequest,
)
from app.services.llm_provider import LLMProviderError
from app.services.study_quiz_service import (
    BaseQuizProvider,
    GeminiQuizProvider,
    LocalQuizProvider,
    quiz_level,
)

router = APIRouter(prefix="/study/quizzes", tags=["Study Quiz"])


@lru_cache
def get_quiz_provider() -> BaseQuizProvider:
    if settings.llm_provider == "gemini":
        if settings.gemini_api_key is None:
            raise RuntimeError("Gemini API anahtarı yapılandırılmamış.")
        return GeminiQuizProvider(
            api_key=settings.gemini_api_key.get_secret_value(),
            model=settings.gemini_model,
            timeout_seconds=settings.llm_timeout_seconds,
            max_input_chars=settings.llm_max_input_chars,
        )
    return LocalQuizProvider()


QuizProvider = Annotated[BaseQuizProvider, Depends(get_quiz_provider)]


@router.post(
    "/generate",
    response_model=ApiResponse[StudyQuizRead],
    status_code=status.HTTP_201_CREATED,
)
async def generate_study_quiz(
    payload: StudyQuizGenerateRequest,
    db: DbSession,
    current_user: CurrentUser,
    provider: QuizProvider,
) -> ApiResponse[StudyQuizRead]:
    source_text = payload.topic or ""
    topic = payload.topic or "Ders materyali"

    if payload.document_id is not None:
        document = db.get(Document, payload.document_id)
        if document is None or document.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcıya ait belge bulunamadı.",
            )
        if document.extracted_text:
            source_text = document.extracted_text
        if not payload.topic:
            topic = document.original_filename.rsplit(".", 1)[0]

    try:
        generated = await provider.generate_quiz(
            topic=topic,
            source_text=source_text,
            question_count=payload.question_count,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except LLMProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    stored_questions = []
    public_questions = []
    for index, question in enumerate(generated.questions, start=1):
        question_id = f"q{index}"
        stored_questions.append({"id": question_id, **question.model_dump()})
        public_questions.append(
            StudyQuizQuestionRead(
                id=question_id,
                question=question.question,
                options=question.options,
            )
        )

    quiz = StudyQuiz(
        user_id=current_user.id,
        topic=topic,
        questions=stored_questions,
        question_count=len(stored_questions),
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return ApiResponse(
        message="Yapay zekâ destekli quiz oluşturuldu.",
        data=StudyQuizRead(
            quiz_id=quiz.id,
            topic=quiz.topic,
            questions=public_questions,
        ),
    )


@router.post(
    "/submit",
    response_model=ApiResponse[StudyQuizResultRead],
    status_code=status.HTTP_201_CREATED,
)
def submit_study_quiz(
    payload: StudyQuizSubmitRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> ApiResponse[StudyQuizResultRead]:
    quiz = db.get(StudyQuiz, payload.quiz_id)
    if quiz is None or quiz.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcıya ait quiz bulunamadı.",
        )
    if len(payload.answers) != quiz.question_count:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Tüm quiz soruları cevaplanmalıdır.",
        )

    review = []
    stored_answers = []
    correct_count = 0
    for question, selected_index in zip(quiz.questions, payload.answers, strict=True):
        options = question["options"]
        if selected_index < 0 or selected_index >= len(options):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Geçersiz cevap seçeneği gönderildi.",
            )
        correct_index = int(question["correct_index"])
        is_correct = selected_index == correct_index
        correct_count += int(is_correct)
        stored_answers.append(
            {
                "question_id": question["id"],
                "selected_index": selected_index,
                "correct_index": correct_index,
            }
        )
        review.append(
            StudyQuizReviewItem(
                question_id=question["id"],
                selected_index=selected_index,
                correct_index=correct_index,
                is_correct=is_correct,
                explanation=question["explanation"],
            )
        )

    score = round((correct_count / quiz.question_count) * 100)
    level = quiz_level(score)
    result = QuizResult(
        user_id=current_user.id,
        quiz_type="study",
        answers=stored_answers,
        score=score,
        total_questions=quiz.question_count,
        category_scores={"study": score},
        result_level=level,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return ApiResponse(
        message="Quiz sonucu değerlendirildi ve kaydedildi.",
        data=StudyQuizResultRead(
            result_id=result.id,
            score=score,
            correct=correct_count,
            total=quiz.question_count,
            result_level=level,
            review=review,
        ),
    )
