from fastapi import APIRouter

from app.api.routes import (
    auth,
    health,
    ocr,
    sprint3,
    summary,
    study_quiz,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(ocr.router)
api_router.include_router(summary.router)
api_router.include_router(study_quiz.router)
api_router.include_router(sprint3.router)
