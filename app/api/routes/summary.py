from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DbSession
from app.models.analysis_result import AnalysisResult
from app.models.document import Document
from app.schemas.common import ApiResponse
from app.schemas.summary import (
    SummaryRequest,
    SummaryResultRead,
)
from app.services.chunking import chunk_text
from app.services.llm_provider import (
    BaseLLMProvider,
    LocalSummaryProvider,
)

router = APIRouter(
    prefix="/study",
    tags=["Study Agent"],
)


def get_summary_provider() -> BaseLLMProvider:
    return LocalSummaryProvider()


SummaryProvider = Annotated[
    BaseLLMProvider,
    Depends(get_summary_provider),
]


@router.post(
    "/summary",
    response_model=ApiResponse[SummaryResultRead],
    status_code=status.HTTP_201_CREATED,
)
async def create_summary(
    payload: SummaryRequest,
    db: DbSession,
    current_user: CurrentUser,
    provider: SummaryProvider,
) -> ApiResponse[SummaryResultRead]:
    """
    Kullanıcının OCR ile yüklediği belgeyi özetler.

    İstekte metin gönderilmezse Document tablosundaki extracted_text
    kullanılır. Sonuç AnalysisResult tablosuna kaydedilir.
    """
    document = db.scalar(
        select(Document).where(
            Document.id == payload.document_id,
            Document.user_id == current_user.id,
        )
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcıya ait belge bulunamadı.",
        )

    source_text = payload.text or document.extracted_text

    if not source_text or not source_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Belgede özetlenecek metin bulunamadı.",
        )

    chunks = chunk_text(source_text)

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Metin özetleme için parçalara ayrılamadı.",
        )

    try:
        summary_response = await provider.generate_summary(
            source_text,
        )

        analysis_result = AnalysisResult(
            document_id=document.id,
            analysis_type="summary",
            result_text=summary_response.summary,
            result_data={
                "keyPoints": (
                    summary_response.key_points.model_dump()
                ),
                "chunkCount": len(chunks),
                "provider": "local",
            },
        )
        db.add(analysis_result)
        db.commit()
        db.refresh(analysis_result)

    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Özet oluşturulurken beklenmeyen bir hata oluştu.",
        ) from exc

    response_data = SummaryResultRead(
        analysis_result_id=analysis_result.id,
        document_id=document.id,
        summary=summary_response.summary,
        key_points=summary_response.key_points,
    )

    return ApiResponse(
        message="Belge özeti başarıyla oluşturuldu.",
        data=response_data,
    )