from io import BytesIO
from pathlib import Path

from docx import Document as DocxDocument
from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader

from app.core.config import settings

MIME_TYPES = {
    "pdf": {"application/pdf"},
    "docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"},
    "txt": {"text/plain", "application/octet-stream"},
}


async def read_and_validate_cv(file: UploadFile) -> tuple[bytes, str]:
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower().lstrip(".")
    if not filename or extension not in settings.allowed_cv_extension_set:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Desteklenen dosya türleri: {', '.join(sorted(settings.allowed_cv_extension_set))}.")
    if file.content_type and file.content_type not in MIME_TYPES.get(extension, set()):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Dosyanın MIME türü uzantısıyla uyumlu değil.")
    limit = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read(limit + 1)
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Boş dosya yüklenemez.")
    if len(content) > limit:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=f"Dosya en fazla {settings.max_upload_size_mb} MB olabilir.")
    return content, extension


def extract_text(content: bytes, extension: str) -> str:
    try:
        if extension == "pdf":
            text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages)
        elif extension == "docx":
            text = "\n".join(paragraph.text for paragraph in DocxDocument(BytesIO(content)).paragraphs)
        else:
            text = content.decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Dosya içeriği okunamadı veya dosya bozuk.") from exc
    if len(text.strip()) < 20:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Analiz için dosyada yeterli metin bulunamadı.")
    return text.strip()
