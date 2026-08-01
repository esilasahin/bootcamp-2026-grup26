# Frontend Authentication API Sözleşmesi

Bu dosya yalnızca `feature/frontend-auth` ile backend authentication modülünün
entegrasyon sözleşmesini açıklar. 

Base URL: `http://localhost:8000/api/v1`

## Kayıt

`POST /auth/register`

```json
{
  "fullName": "Nurcan Altuğ",
  "email": "nurcan@example.com",
  "password": "Guclu123"
}
```

Başarılı cevap: `201 Created`.

## Giriş

`POST /auth/login`

```json
{
  "email": "nurcan@example.com",
  "password": "Guclu123"
}
```

Başarılı cevap:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "fullName": "Nurcan Altuğ",
    "email": "nurcan@example.com",
    "isActive": true,
    "createdAt": "2026-07-18T18:00:00Z"
  }
}
```

## Mevcut kullanıcı

`GET /users/me`

```text
Authorization: Bearer <token>
```

