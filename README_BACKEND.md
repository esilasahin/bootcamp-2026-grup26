# UniMate AI —  Backend Authentication ve Database


## Kapsam

- FastAPI proje iskeleti
- Environment variable yapısı
- PostgreSQL ve SQLAlchemy 2 bağlantısı
- `User`, `Document`, `AnalysisResult` modelleri
- User–Document ve Document–AnalysisResult ilişkileri
- Alembic ilk migration
- Register ve login endpointleri
- Argon2 parola hashleme
- JWT oluşturma ve doğrulama
- `GET /users/me` korumalı endpointi
- CORS ve Swagger
- Authentication ve model testleri

## Bu pakette özellikle bulunmayanlar

- React frontend kaynak kodu
- OCR endpointi veya OCR servis kodu
- PDF/görsel metin çıkarma kodu
- Study Agent ve LLM kodu
- Summary endpointi

Bunlar ilgili ekip arkadaşlarının branch'lerinde geliştirilecektir.

## Kurulum

### 1. Sanal ortam

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Bağımlılıklar

```bash
pip install -r requirements.txt
```

### 3. Ortam değişkenleri

Windows:

```powershell
copy .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

### 4. PostgreSQL

```bash
docker compose up -d db
```

### 5. Migration

```bash
alembic upgrade head
```

### 6. Uygulama

```bash
uvicorn app.main:app --reload
```

- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/v1/health`

## Test

```bash
pytest
```

## Endpointler

| Method | Endpoint | Açıklama | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Kullanıcı kaydı | Hayır |
| POST | `/api/v1/auth/login` | JSON ile giriş | Hayır |
| POST | `/api/v1/auth/token` | Swagger/OAuth2 form girişi | Hayır |
| GET | `/api/v1/users/me` | Giriş yapan kullanıcı | Evet |
| GET | `/api/v1/health` | Servis kontrolü | Hayır |
| GET | `/api/v1/health/database` | Veritabanı kontrolü | Hayır |



## Diğer modüller için entegrasyon noktaları

- OCR modülü, `app.api.dependencies.CurrentUser` ve `DbSession` bağımlılıklarını
  kullanabilir.
- OCR modülü çıkarılan metni `Document.extracted_text` alanına yazabilir.
- Study Agent sonucu `AnalysisResult` tablosuna `document_id` ile bağlanabilir.
- Frontend, `FRONTEND_API_CONTRACT.md` içindeki endpointleri çağırabilir.

## Doğrulama durumu

Bu paket temiz bir Python 3.13 sanal ortamında doğrulandı:

```bash
python -m compileall -q app alembic tests
pip check
pytest
alembic upgrade head
alembic check
alembic downgrade base
```

Sonuç: **11 test başarılı**, bağımlılık çakışması yok, migration ile SQLAlchemy
modelleri uyumlu ve uygulama Uvicorn üzerinden başlatılabiliyor.

