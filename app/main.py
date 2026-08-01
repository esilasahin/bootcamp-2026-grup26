from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="UniMate AI için authentication ve veritabanı temel servisi.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)
logger = logging.getLogger(__name__)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": str(exc.detail), "data": None,
        "errors": [{"code": f"HTTP_{exc.status_code}", "field": None, "message": str(exc.detail)}]}, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [{"code": "VALIDATION_ERROR", "field": ".".join(str(part) for part in error["loc"] if part != "body"), "message": error["msg"]} for error in exc.errors()]
    return JSONResponse(status_code=422, content={"success": False, "message": "Gönderilen veriler geçersiz.", "data": None, "errors": errors})


@app.exception_handler(Exception)
async def unexpected_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Beklenmeyen API hatası: %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"success": False, "message": "Beklenmeyen bir sunucu hatası oluştu.", "data": None,
        "errors": [{"code": "INTERNAL_SERVER_ERROR", "field": None, "message": "İşlem tamamlanamadı."}]})


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "message": "UniMate AI API çalışıyor.",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
    }
