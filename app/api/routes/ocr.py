from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict, Field

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import settings
from app.models.document import Document
from app.schemas.common import ApiResponse
from app.services.ocr_service import SUPPORTED_EXTENSIONS, process_uploaded_file

router = APIRouter(prefix="/ocr", tags=["OCR"])

ALLOWED_MIME_TYPES = {
    ".pdf": {"application/pdf"},
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
    ".png": {"image/png"},
}


class OCRResultRead(BaseModel):
    document_id: int = Field(serialization_alias="documentId")
    original_filename: str = Field(serialization_alias="originalFilename")
    text: str
    page_count: int = Field(serialization_alias="pageCount")
    method: str

    model_config = ConfigDict(populate_by_name=True)


@router.post(
    "/upload",
    response_model=ApiResponse[OCRResultRead],
    status_code=status.HTTP_201_CREATED,
)
async def upload_and_extract_text(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> ApiResponse[OCRResultRead]:
    """
    PDF, JPG, JPEG veya PNG dosyasından metin çıkarır.

    Dosya türü, MIME tipi ve boyutu doğrulanır. Başarılı OCR sonucu,
    giriş yapan kullanıcıya ait Document kaydı olarak veritabanına yazılır.
    """
    original_filename = Path(file.filename or "").name
    extension = Path(original_filename).suffix.lower()

    if not original_filename or extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Desteklenmeyen dosya türü. Desteklenenler: {supported}",
        )

    allowed_mime_types = ALLOWED_MIME_TYPES.get(extension, set())
    if file.content_type not in allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Dosyanın MIME türü uzantısıyla uyumlu değil.",
        )

    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read(max_size_bytes + 1)

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Boş dosya yüklenemez.",
        )

    if len(content) > max_size_bytes:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Dosya en fazla {settings.max_upload_size_mb} MB olabilir.",
        )

    temp_path: Path | None = None

    try:
        with NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        result = await run_in_threadpool(
            process_uploaded_file,
            str(temp_path),
        )

        if not result["success"]:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=result["error"] or "Dosyadan metin çıkarılamadı.",
            )

        document = Document(
            user_id=current_user.id,
            original_filename=original_filename,
            file_type=extension.lstrip("."),
            extracted_text=result["text"],
            status="extracted",
            page_count=result["page_count"],
            extraction_method=result["method"],
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        response_data = OCRResultRead(
            document_id=document.id,
            original_filename=document.original_filename,
            text=result["text"],
            page_count=result["page_count"],
            method=result["method"],
        )

        return ApiResponse(
            message="Dosyadan metin başarıyla çıkarıldı.",
            data=response_data,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR işlemi sırasında beklenmeyen bir hata oluştu.",
        ) from exc
    finally:
        await file.close()
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)