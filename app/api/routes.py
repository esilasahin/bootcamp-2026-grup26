from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import SummaryRequest, SummaryResponse
from app.services.chunking import chunk_text
from app.services.llm_provider import MockLLMProvider, BaseLLMProvider
from app.services.db_mock import save_summary_to_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency Injection için
def get_llm_provider() -> BaseLLMProvider:
    return MockLLMProvider()

@router.post("/summary", response_model=SummaryResponse, summary="Belge Özetleme Endpoint'i")
async def create_summary(
    request: SummaryRequest,
    llm_provider: BaseLLMProvider = Depends(get_llm_provider)
):
    """
    Frontend'den gelen ham metni alır, parçalara ayırır, LLM servisi ile özetler 
    ve sonucu veritabanına kaydederek geri döner.
    """
    raw_text = request.text
    
    if not raw_text or not raw_text.strip():
        logger.error("Boş metin gönderildi.")
        raise HTTPException(status_code=400, detail="Özetlenecek metin boş olamaz.")
        
    try:
        # 1. Metni Parçalama (Chunking)
        chunks = chunk_text(raw_text)
        logger.info(f"Metin {len(chunks)} parçaya ayrıldı.")
        
        # 2. LLM Özet Fonksiyonu
        summary_result = await llm_provider.generate_summary(raw_text)
        
        if not summary_result or not summary_result.summary:
            raise ValueError("LLM boş veya geçersiz bir özet döndürdü.")
            
        # 3. Veritabanına Kaydetme (Mock ORM)
        record_id = await save_summary_to_db(raw_text, summary_result)
        logger.info(f"Özet veritabanına kaydedildi. ID: {record_id}")
        
        # 4. Frontend'e dönme
        return summary_result
        
    except ValueError as ve:
        logger.error(f"LLM İşlem Hatası: {str(ve)}")
        raise HTTPException(status_code=502, detail="LLM servisi geçerli bir yanıt üretemedi.")
    except Exception as e:
        logger.error(f"Beklenmeyen Hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Özet oluşturulurken sunucu tarafında bir hata oluştu.")
