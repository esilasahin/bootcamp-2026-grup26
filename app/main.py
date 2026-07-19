from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "message": "UniMate AI API çalışıyor.",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
    }
