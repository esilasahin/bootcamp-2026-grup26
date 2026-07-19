from fastapi import FastAPI
from app.api.routes import router as summary_router

app = FastAPI(
    title="Study Agent ve Özet Servisi",
    description="Eğitim teknolojisi MVP projesi için metin parçalama, LLM entegrasyonu ve özet oluşturma API'si.",
    version="1.0.0"
)

# Endpoint'leri dahil et
app.include_router(summary_router, prefix="/api", tags=["Summary"])

@app.get("/")
def read_root():
    return {"message": "Study Agent ve Özet Servisi API'sine Hoş Geldiniz!"}
