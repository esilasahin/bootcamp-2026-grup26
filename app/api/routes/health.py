from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.api.dependencies import DbSession

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/database")
def database_health_check(db: DbSession) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Veritabanına ulaşılamıyor.") from exc
    return {"status": "ok", "database": "reachable"}
