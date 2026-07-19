from abc import ABC, abstractmethod
import asyncio
from app.models.schemas import SummaryResponse, KeyPoints, KeyPoint

class BaseLLMProvider(ABC):
    """
    LLM servisleri için temel soyut sınıf (Abstract Base Class).
    Hangi LLM (OpenAI, Gemini, vb.) kullanılacaksa bu sınıftan türetilmelidir.
    """
    
    @abstractmethod
    async def generate_summary(self, text: str) -> SummaryResponse:
        """
        Verilen metin için özet ve önemli noktaları üretir.
        
        Args:
            text (str): Özetlenecek metin.
            
        Returns:
            SummaryResponse: Özet ve önemli noktaları içeren Pydantic modeli.
        """
        pass


class MockLLMProvider(BaseLLMProvider):
    """
    Gerçek bir LLM API'sine bağlanmadan test yapabilmek için statik veri dönen Mock sınıf.
    """
    
    async def generate_summary(self, text: str) -> SummaryResponse:
        """
        API bağlanana kadar statik (mock) Pydantic JSON verisi döner.
        """
        # Gecikmeyi simüle edelim
        await asyncio.sleep(1)
        
        return SummaryResponse(
            summary="Bu, sisteme yüklenen belgenin mock (yapay) bir özetidir. Gerçek API entegrasyonu sağlandığında burada belgenin anlamlı bir özeti yer alacaktır.",
            key_points=KeyPoints(
                points=[
                    KeyPoint(
                        title="Mock Entegrasyon",
                        description="Sistem şu anda mock bir LLM sağlayıcısı ile çalışmaktadır."
                    ),
                    KeyPoint(
                        title="Metin Parçalama",
                        description="Uzun metinler başarıyla token sınırlarına göre parçalara ayrıldı."
                    ),
                    KeyPoint(
                        title="Veri Modelleri",
                        description="Pydantic kullanılarak JSON tip güvenliği sağlandı."
                    )
                ]
            )
        )
