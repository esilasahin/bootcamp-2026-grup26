import pytest
from sqlalchemy import select

from app.api.routes.study_quiz import get_quiz_provider
from app.db.session import SessionLocal
from app.main import app
from app.models.quiz_result import QuizResult
from app.services.study_quiz_service import LocalQuizProvider


@pytest.fixture(autouse=True)
def use_local_quiz_provider():
    app.dependency_overrides[get_quiz_provider] = lambda: LocalQuizProvider()
    yield
    app.dependency_overrides.pop(get_quiz_provider, None)


def auth_headers(client, email: str) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Quiz Test User",
            "email": email,
            "password": "Guclu123",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Guclu123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_generated_quiz_requires_authentication(client):
    response = client.post(
        "/api/v1/study/quizzes/generate",
        json={"topic": "FastAPI", "questionCount": 3},
    )
    assert response.status_code == 401


def test_quiz_is_generated_without_exposing_answers(client):
    headers = auth_headers(client, "quiz-generate@example.com")
    response = client.post(
        "/api/v1/study/quizzes/generate",
        headers=headers,
        json={"topic": "FastAPI", "questionCount": 3},
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["quizId"] > 0
    assert data["konu"] == "FastAPI"
    assert len(data["questions"]) == 3
    assert "correctIndex" not in data["questions"][0]


def test_generated_quiz_is_scored_and_saved(client):
    headers = auth_headers(client, "quiz-submit@example.com")
    generated = client.post(
        "/api/v1/study/quizzes/generate",
        headers=headers,
        json={"topic": "SQLAlchemy", "questionCount": 3},
    ).json()["data"]

    response = client.post(
        "/api/v1/study/quizzes/submit",
        headers=headers,
        json={"quizId": generated["quizId"], "answers": [0, 0, 0]},
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["score"] == 100
    assert data["correct"] == 3
    assert len(data["review"]) == 3

    with SessionLocal() as db:
        result = db.scalar(select(QuizResult).where(QuizResult.quiz_type == "study"))
        assert result is not None
        assert result.score == 100
        assert result.total_questions == 3


def test_user_cannot_submit_another_users_quiz(client):
    owner_headers = auth_headers(client, "quiz-owner@example.com")
    generated = client.post(
        "/api/v1/study/quizzes/generate",
        headers=owner_headers,
        json={"topic": "Python", "questionCount": 3},
    ).json()["data"]
    other_headers = auth_headers(client, "quiz-other@example.com")

    response = client.post(
        "/api/v1/study/quizzes/submit",
        headers=other_headers,
        json={"quizId": generated["quizId"], "answers": [0, 0, 0]},
    )
    assert response.status_code == 404
