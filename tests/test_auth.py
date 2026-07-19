def register_user(client, email="nurcan@example.com"):
    return client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Nurcan Altuğ",
            "email": email,
            "password": "Guclu123",
        },
    )


def test_register_login_and_me(client):
    register_response = register_user(client)
    assert register_response.status_code == 201
    assert register_response.json()["fullName"] == "Nurcan Altuğ"
    assert "hashed_password" not in register_response.json()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "nurcan@example.com", "password": "Guclu123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token

    me_response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "nurcan@example.com"


def test_duplicate_email_is_rejected(client):
    assert register_user(client).status_code == 201
    duplicate = register_user(client)
    assert duplicate.status_code == 409


def test_wrong_password_is_rejected(client):
    assert register_user(client).status_code == 201
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nurcan@example.com", "password": "yanlis"},
    )
    assert response.status_code == 401


def test_protected_endpoint_requires_token(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_email_is_case_insensitive(client):
    assert register_user(client, email="Nurcan@Example.com").status_code == 201
    duplicate = register_user(client, email="nurcan@example.com")
    assert duplicate.status_code == 409


def test_password_whitespace_is_preserved(client):
    password = "  Guclu123  "
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "  Nurcan Altuğ  ",
            "email": "spaces@example.com",
            "password": password,
        },
    )
    assert register_response.status_code == 201
    assert register_response.json()["fullName"] == "Nurcan Altuğ"

    correct_login = client.post(
        "/api/v1/auth/login",
        json={"email": "spaces@example.com", "password": password},
    )
    assert correct_login.status_code == 200

    trimmed_login = client.post(
        "/api/v1/auth/login",
        json={"email": "spaces@example.com", "password": password.strip()},
    )
    assert trimmed_login.status_code == 401


def test_invalid_token_is_rejected(client):
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )
    assert response.status_code == 401


def test_oauth2_token_endpoint(client):
    assert register_user(client).status_code == 201
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "nurcan@example.com", "password": "Guclu123"},
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_cors_preflight_for_frontend(client):
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
