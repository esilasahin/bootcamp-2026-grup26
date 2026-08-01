from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.analysis_result import AnalysisResult
from app.models.document import Document
from app.models.user import User


def auth_headers(client, email):
    client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Study Test User",
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


def create_document(email):
    with SessionLocal() as db:
        user = db.scalar(
            select(User).where(User.email == email)
        )
        document = Document(
            user_id=user.id,
            original_filename="lesson.pdf",
            file_type="pdf",
            extracted_text=(
                "FastAPI modern bir Python web frameworküdür. "
                "JWT kullanıcı kimlik doğrulaması için kullanılır. "
                "SQLAlchemy veritabanı işlemlerini yönetir."
            ),
            status="extracted",
            page_count=1,
            extraction_method="pdf_text",
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        return document.id


def test_summary_requires_authentication(client):
    response = client.post(
        "/api/v1/study/summary",
        json={"documentId": 1},
    )

    assert response.status_code == 401


def test_summary_is_created_and_saved(client):
    email = "study@example.com"
    headers = auth_headers(client, email)
    document_id = create_document(email)

    response = client.post(
        "/api/v1/study/summary",
        headers=headers,
        json={"documentId": document_id},
    )

    assert response.status_code == 201
    body = response.json()

    assert body["success"] is True
    assert body["data"]["documentId"] == document_id
    assert body["data"]["summary"]
    assert body["data"]["keyPoints"]["points"]

    analysis_result_id = body["data"]["analysisResultId"]

    with SessionLocal() as db:
        result = db.get(
            AnalysisResult,
            analysis_result_id,
        )

        assert result is not None
        assert result.document_id == document_id
        assert result.analysis_type == "summary"
        assert result.result_text


def test_user_cannot_summarize_another_users_document(client):
    first_email = "study-owner@example.com"
    auth_headers(client, first_email)
    document_id = create_document(first_email)

    second_headers = auth_headers(
        client,
        "study-other@example.com",
    )

    response = client.post(
        "/api/v1/study/summary",
        headers=second_headers,
        json={"documentId": document_id},
    )

    assert response.status_code == 404