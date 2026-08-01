"""
OCR Route
---------
Kullanıcının PDF veya görsel dosya yükleyip metin çıkarma işlemini
tetiklediği API endpoint'i burada tanımlanır.
"""

import os
import shutil
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.ocr_service import SUPPORTED_EXTENSIONS, process_uploaded_file

router = APIRouter(prefix="/ocr", tags=["OCR"])

UPLOAD_DIR = "uploads"


# ---------------------------------------------------------------------------
# RESPONSE ŞEMASI
# ---------------------------------------------------------------------------

class OCRResponse(BaseModel):
    success: bool
    text: str
    page_count: int
    method: str | None
    error: str | None


# ---------------------------------------------------------------------------
# ENDPOINT
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=OCRResponse)
async def upload_and_extract_text(file: UploadFile = File(...)):
    """
    Kullanıcının yüklediği PDF veya görsel dosyadan metin çıkarır.

    - PDF ise: önce metin katmanına bakılır, yoksa OCR uygulanır.
    - JPG/PNG ise: direkt OCR uygulanır.
    """
    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya türü: {extension}. "
                   f"Desteklenenler: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Dosyayı benzersiz bir isimle geçici olarak kaydet
    temp_filename = f"{uuid.uuid4()}{extension}"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = process_uploaded_file(temp_path)

        if not result["success"]:
            raise HTTPException(status_code=422, detail=result["error"])

        return OCRResponse(**result)

    finally:
        # Geçici dosyayı temizle
        if os.path.exists(temp_path):
            os.remove(temp_path)