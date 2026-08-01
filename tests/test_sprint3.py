def auth_headers(client, email="sprint3@example.com"):
    client.post("/api/v1/auth/register", json={"fullName": "Sprint User", "email": email, "password": "Guclu123"})
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "Guclu123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_complete_sprint3_flow(client):
    headers = auth_headers(client)
    questions = client.get("/api/v1/quizzes/career", headers=headers)
    assert questions.status_code == 200
    assert len(questions.json()["data"]) == 5
    quiz = client.post("/api/v1/quizzes/results", headers=headers, json={"quizType": "career", "answers": [
        {"questionId": "q1", "category": "backend", "value": 5},
        {"questionId": "q2", "category": "backend", "value": 4},
        {"questionId": "q3", "category": "teamwork", "value": 3},
    ]})
    assert quiz.status_code == 201
    assert quiz.json()["data"]["score"] == 80

    cv_text = ("Nurcan Altuğ nurcan@example.com Bilgisayar Mühendisliği üniversite eğitim. "
               "Python FastAPI PostgreSQL SQL Docker Git ile backend projeleri geliştirdim ve staj deneyimi kazandım.")
    cv = client.post("/api/v1/cv/analyze", headers=headers,
                     files={"file": ("cv.txt", cv_text.encode(), "text/plain")})
    assert cv.status_code == 201, cv.text
    analysis_id = cv.json()["data"]["id"]
    assert "python" in cv.json()["data"]["skills"]

    match = client.post("/api/v1/jobs/match", headers=headers, json={
        "jobTitle": "Backend Developer", "jobDescription": "Python FastAPI PostgreSQL Docker ve Redis bilen backend geliştirici arıyoruz.",
        "cvAnalysisId": analysis_id,
    })
    assert match.status_code == 200
    assert "redis" in match.json()["data"]["missingSkills"]

    coach = client.post("/api/v1/coach/recommendations", headers=headers, json={"targetRole": "Python Backend Developer"})
    assert coach.status_code == 201
    assert coach.json()["data"]["recommendedRole"] == "Python Backend Developer"

    history = client.get("/api/v1/users/me/analysis-history", headers=headers)
    assert history.status_code == 200
    assert {item["type"] for item in history.json()["data"]} == {"cv_analysis", "quiz_result", "coach_recommendation"}


def test_upload_validation_and_auth(client):
    assert client.post("/api/v1/cv/analyze", files={"file": ("cv.txt", b"valid enough text for a cv", "text/plain")}).status_code == 401
    headers = auth_headers(client, "files@example.com")
    invalid = client.post("/api/v1/cv/analyze", headers=headers, files={"file": ("cv.exe", b"not allowed", "application/octet-stream")})
    assert invalid.status_code == 415
    assert invalid.json()["success"] is False
    empty = client.post("/api/v1/cv/analyze", headers=headers, files={"file": ("cv.txt", b"", "text/plain")})
    assert empty.status_code == 400


def test_user_cannot_use_another_users_analysis(client):
    first = auth_headers(client, "first@example.com")
    cv = client.post("/api/v1/cv/analyze", headers=first, files={"file": ("cv.txt", b"Python FastAPI experience education user@example.com long enough text", "text/plain")})
    analysis_id = cv.json()["data"]["id"]
    second = auth_headers(client, "second@example.com")
    response = client.post("/api/v1/jobs/match", headers=second, json={"jobTitle": "Backend", "jobDescription": "Python FastAPI developer position with SQL and Docker skills.", "cvAnalysisId": analysis_id})
    assert response.status_code == 404


def test_quiz_rejects_duplicate_questions(client):
    headers = auth_headers(client)
    response = client.post("/api/v1/quizzes/results", headers=headers, json={"answers": [
        {"questionId": "q1", "category": "backend", "value": 3},
        {"questionId": "q1", "category": "backend", "value": 4},
    ]})
    assert response.status_code == 422
    assert response.json()["errors"][0]["code"] == "VALIDATION_ERROR"
