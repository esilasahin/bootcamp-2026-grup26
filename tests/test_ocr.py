from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.document import Document


def auth_headers(client, email="ocr@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "OCR Test User",
            "email": email,
            "password": "Guclu123",
        },
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "Guclu123",
        },
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_ocr_upload_requires_authentication(client):
    response = client.post(
        "/api/v1/ocr/upload",
        files={"file": ("document.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 401


def test_successful_ocr_is_saved_to_database(client, monkeypatch):
    headers = auth_headers(client)
    processed_path = None

    def fake_process_uploaded_file(file_path):
        nonlocal processed_path
        processed_path = file_path
        assert Path(file_path).exists()

        return {
            "success": True,
            "text": "OCR ile çıkarılan örnek metin.",
            "page_count": 1,
            "method": "ocr",
            "error": None,
        }

    monkeypatch.setattr(
        "app.api.routes.ocr.process_uploaded_file",
        fake_process_uploaded_file,
    )

    response = client.post(
        "/api/v1/ocr/upload",
        headers=headers,
        files={"file": ("document.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 201
    body = response.json()

    assert body["success"] is True
    assert body["data"]["originalFilename"] == "document.png"
    assert body["data"]["text"] == "OCR ile çıkarılan örnek metin."
    assert body["data"]["pageCount"] == 1
    assert body["data"]["method"] == "ocr"

    assert processed_path is not None
    assert not Path(processed_path).exists()

    with SessionLocal() as db:
        document = db.scalar(
            select(Document).where(
                Document.id == body["data"]["documentId"]
            )
        )

        assert document is not None
        assert document.original_filename == "document.png"
        assert document.extracted_text == "OCR ile çıkarılan örnek metin."
        assert document.status == "extracted"


def test_ocr_rejects_unsupported_extension(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/ocr/upload",
        headers=headers,
        files={"file": ("document.exe", b"invalid", "application/octet-stream")},
    )

    assert response.status_code == 415
    assert response.json()["success"] is False


def test_ocr_rejects_mime_type_mismatch(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/ocr/upload",
        headers=headers,
        files={"file": ("document.png", b"invalid", "application/pdf")},
    )

    assert response.status_code == 415


def test_ocr_rejects_empty_file(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/ocr/upload",
        headers=headers,
        files={"file": ("document.png", b"", "image/png")},
    )

    assert response.status_code == 400


def test_ocr_rejects_oversized_file(client, monkeypatch):
    headers = auth_headers(client)

    monkeypatch.setattr(
        "app.api.routes.ocr.settings.max_upload_size_mb",
        1,
    )

    response = client.post(
        "/api/v1/ocr/upload",
        headers=headers,
        files={
            "file": (
                "document.png",
                b"x" * (1024 * 1024 + 1),
                "image/png",
            )
        },
    )

    assert response.status_code == 413


def test_ocr_processing_failure_returns_422(client, monkeypatch):
    headers = auth_headers(client)

    monkeypatch.setattr(
        "app.api.routes.ocr.process_uploaded_file",
        lambda _path: {
            "success": False,
            "text": "",
            "page_count": 0,
            "method": None,
            "error": "Dosyadan metin çıkarılamadı.",
        },
    )

    response = client.post(
        "/api/v1/ocr/upload",
        headers=headers,
        files={"file": ("document.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 422
    assert response.json()["success"] is False