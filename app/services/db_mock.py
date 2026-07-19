import uuid
import logging
from app.models.schemas import SummaryResponse

# Basit bir loglama ayarı
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def save_summary_to_db(original_text: str, summary_data: SummaryResponse) -> str:
    """
    Üretilen özeti veritabanına kaydeder (Mock ORM).
    
    Args:
        original_text (str): Kullanıcıdan gelen orijinal metin.
        summary_data (SummaryResponse): LLM tarafından üretilen özet verisi.
        
    Returns:
        str: Kaydedilen verinin benzersiz ID'si.
    """
    record_id = str(uuid.uuid4())
    
    # Gerçek bir ORM'de (örn. SQLAlchemy) db.add(record) ve db.commit() yapılacaktır.
    logger.info(f"DB Kayıt İşlemi Başarılı. Kayıt ID: {record_id}")
    logger.debug(f"Kaydedilen Veri: {summary_data.model_dump_json()}")
    
    return record_id
