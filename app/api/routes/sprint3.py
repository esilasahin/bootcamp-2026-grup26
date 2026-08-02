from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import desc, select

from app.api.dependencies import CurrentUser, DbSession
from app.models.analysis_result import AnalysisResult
from app.models.coach_recommendation import (
    CoachRecommendation,
)
from app.models.cv_analysis import CVAnalysis
from app.models.document import Document
from app.models.quiz_result import QuizResult
from app.schemas.common import ApiResponse
from app.schemas.sprint3 import (
    CVAnalysisRead,
    CoachRecommendationRead,
    CoachRequest,
    HistoryItem,
    JobMatchRead,
    JobMatchRequest,
    QuizQuestion,
    QuizResultRead,
    QuizSubmission,
)
from app.services.file_service import (
    extract_text,
    read_and_validate_cv,
)
from app.services.sprint3_service import (
    analyze_cv_text,
    match_job,
    score_quiz,
)

router = APIRouter(tags=["Sprint 3"])


QUIZ_QUESTIONS = [
    QuizQuestion(
        id="technical-confidence",
        text=(
            "Teknik problemleri bağımsız çözme konusunda "
            "kendinize ne kadar güveniyorsunuz?"
        ),
        category="technical",
        min_value=0,
        max_value=5,
    ),
    QuizQuestion(
        id="backend-interest",
        text=(
            "Backend geliştirmeye ilginiz hangi seviyede?"
        ),
        category="backend",
        min_value=0,
        max_value=5,
    ),
    QuizQuestion(
        id="data-interest",
        text=(
            "Veri ve yapay zekâ alanına ilginiz "
            "hangi seviyede?"
        ),
        category="data_ai",
        min_value=0,
        max_value=5,
    ),
    QuizQuestion(
        id="teamwork",
        text=(
            "Takım çalışması becerinizi nasıl "
            "değerlendirirsiniz?"
        ),
        category="soft_skills",
        min_value=0,
        max_value=5,
    ),
    QuizQuestion(
        id="learning",
        text=(
            "Yeni teknolojileri düzenli öğrenme "
            "alışkanlığınız hangi seviyede?"
        ),
        category="growth",
        min_value=0,
        max_value=5,
    ),
]


def _owned_analysis(
    db: DbSession,
    user_id: int,
    analysis_id: int | None = None,
) -> CVAnalysis:
    query = select(CVAnalysis).where(
        CVAnalysis.user_id == user_id,
    )

    if analysis_id:
        query = query.where(
            CVAnalysis.id == analysis_id,
        )

    analysis = db.scalar(
        query.order_by(
            desc(CVAnalysis.created_at),
            desc(CVAnalysis.id),
        ).limit(1)
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Kullanıcıya ait CV analizi bulunamadı."
            ),
        )

    return analysis


@router.get(
    "/quizzes/career",
    response_model=ApiResponse[list[QuizQuestion]],
)
def get_career_quiz(
    _current_user: CurrentUser,
):
    return ApiResponse(
        message="Kariyer quiz soruları getirildi.",
        data=QUIZ_QUESTIONS,
    )


@router.post(
    "/quizzes/results",
    response_model=ApiResponse[QuizResultRead],
    status_code=status.HTTP_201_CREATED,
)
def submit_quiz(
    payload: QuizSubmission,
    db: DbSession,
    current_user: CurrentUser,
):
    answers = [
        answer.model_dump(by_alias=False)
        for answer in payload.answers
    ]

    score, category_scores, level = score_quiz(
        answers,
    )

    result = QuizResult(
        user_id=current_user.id,
        quiz_type=payload.quiz_type,
        answers=answers,
        score=score,
        total_questions=len(answers),
        category_scores=category_scores,
        result_level=level,
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return ApiResponse(
        message="Quiz sonucu kaydedildi.",
        data=QuizResultRead.model_validate(result),
    )


@router.post(
    "/cv/analyze",
    response_model=ApiResponse[CVAnalysisRead],
    status_code=status.HTTP_201_CREATED,
)
async def analyze_cv(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    content, extension = await read_and_validate_cv(
        file,
    )

    text = extract_text(content, extension)

    document = Document(
        user_id=current_user.id,
        original_filename=(
            file.filename or f"cv.{extension}"
        ),
        file_type=extension,
        extracted_text=text,
        status="analyzed",
        extraction_method=extension,
    )

    db.add(document)
    db.flush()

    analysis = CVAnalysis(
        user_id=current_user.id,
        document_id=document.id,
        **analyze_cv_text(text),
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return ApiResponse(
        message="CV başarıyla analiz edildi.",
        data=CVAnalysisRead.model_validate(analysis),
    )


@router.post(
    "/jobs/match",
    response_model=ApiResponse[JobMatchRead],
)
def job_match(
    payload: JobMatchRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    analysis = _owned_analysis(
        db,
        current_user.id,
        payload.cv_analysis_id,
    )

    result = match_job(
        analysis,
        payload.job_description,
    )

    return ApiResponse(
        message="İş ilanı eşleştirmesi tamamlandı.",
        data=JobMatchRead(
            job_title=payload.job_title,
            **result,
        ),
    )


@router.post(
    "/coach/recommendations",
    response_model=ApiResponse[
        CoachRecommendationRead
    ],
    status_code=status.HTTP_201_CREATED,
)
def coach(
    payload: CoachRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    analysis = _owned_analysis(
        db,
        current_user.id,
    )

    latest_quiz = db.scalar(
        select(QuizResult)
        .where(
            QuizResult.user_id == current_user.id,
        )
        .order_by(
            desc(QuizResult.completed_at),
            desc(QuizResult.id),
        )
        .limit(1)
    )

    backend_skills = {
        "python",
        "fastapi",
        "django",
        "flask",
    }

    role = payload.target_role or (
        "Backend Developer"
        if backend_skills.intersection(
            analysis.skills or [],
        )
        else "Software Developer"
    )

    gaps = (analysis.weaknesses or [])[:2]

    recommendations = list(
        analysis.recommendations or [],
    )

    if latest_quiz:
        recommendations.append(
            f"Quiz seviyeniz: "
            f"{latest_quiz.result_level}."
        )
    else:
        recommendations.append(
            "Kariyer quizini tamamlayın."
        )

    item = CoachRecommendation(
        user_id=current_user.id,
        recommended_role=role,
        summary=(
            "Mevcut profiliniz için önerilen yön: "
            f"{role}."
        ),
        recommendations=recommendations,
        learning_path=[
            "Temel eksikleri tamamla",
            "Portföy projesi geliştir",
            "Teknik mülakat pratiği yap",
        ],
        priority_actions=(
            gaps
            or [
                (
                    "CV projelerine ölçülebilir "
                    "sonuçlar ekleyin."
                )
            ]
        ),
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return ApiResponse(
        message="Coach önerisi oluşturuldu.",
        data=CoachRecommendationRead.model_validate(
            item,
        ),
    )


@router.get(
    "/users/me/analysis-history",
    response_model=ApiResponse[list[HistoryItem]],
)
def history(
    db: DbSession,
    current_user: CurrentUser,
):
    items: list[HistoryItem] = []

    cv_analyses = db.scalars(
        select(CVAnalysis)
        .where(
            CVAnalysis.user_id == current_user.id,
        )
        .order_by(
            desc(CVAnalysis.created_at),
            desc(CVAnalysis.id),
        )
    ).all()

    for analysis in cv_analyses:
        document = db.get(
            Document,
            analysis.document_id,
        )

        items.append(
            HistoryItem(
                id=analysis.id,
                type="cv_analysis",
                title="CV Analizi",
                summary=analysis.summary,
                created_at=analysis.created_at,
                metadata={
                    "score": analysis.overall_score,
                    "skills": analysis.skills or [],
                    "filename": (
                        document.original_filename
                        if document
                        else None
                    ),
                },
            )
        )

    summary_rows = db.execute(
        select(AnalysisResult, Document)
        .join(
            Document,
            AnalysisResult.document_id
            == Document.id,
        )
        .where(
            Document.user_id == current_user.id,
            AnalysisResult.analysis_type == "summary",
        )
        .order_by(
            desc(AnalysisResult.created_at),
            desc(AnalysisResult.id),
        )
    ).all()

    for analysis_result, document in summary_rows:
        items.append(
            HistoryItem(
                id=analysis_result.id,
                type="study_summary",
                title=document.original_filename,
                summary=(
                    analysis_result.result_text or ""
                ),
                created_at=analysis_result.created_at,
                metadata={
                    "documentId": document.id,
                    "filename": document.original_filename,
                    "keyPoints": (
                        analysis_result.result_data or {}
                    ).get("keyPoints", {}),
                    "provider": (
                        analysis_result.result_data or {}
                    ).get("provider"),
                },
            )
        )

    quiz_results = db.scalars(
        select(QuizResult)
        .where(
            QuizResult.user_id == current_user.id,
        )
        .order_by(
            desc(QuizResult.completed_at),
            desc(QuizResult.id),
        )
    ).all()

    for quiz_result in quiz_results:
        items.append(
            HistoryItem(
                id=quiz_result.id,
                type="quiz_result",
                title=quiz_result.quiz_type,
                summary=(
                    f"Quiz puanı: {quiz_result.score}"
                ),
                created_at=quiz_result.completed_at,
                metadata={
                    "score": quiz_result.score,
                    "level": quiz_result.result_level,
                    "totalQuestions": (
                        quiz_result.total_questions
                    ),
                },
            )
        )

    coach_recommendations = db.scalars(
        select(CoachRecommendation)
        .where(
            CoachRecommendation.user_id
            == current_user.id,
        )
        .order_by(
            desc(CoachRecommendation.created_at),
            desc(CoachRecommendation.id),
        )
    ).all()

    for recommendation in coach_recommendations:
        items.append(
            HistoryItem(
                id=recommendation.id,
                type="coach_recommendation",
                title=recommendation.recommended_role,
                summary=recommendation.summary,
                created_at=recommendation.created_at,
                metadata={},
            )
        )

    items.sort(
        key=lambda item: (
            item.created_at,
            item.id,
        ),
        reverse=True,
    )

    return ApiResponse(
        message="Analiz geçmişi getirildi.",
        data=items,
    )