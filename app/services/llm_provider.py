import asyncio
import re
from abc import ABC, abstractmethod

from google import genai
from google.genai import types

from app.schemas.summary import (
    KeyPoint,
    KeyPoints,
    SummaryResponse,
)


class LLMProviderError(RuntimeError):
    """Harici LLM sağlayıcısından kaynaklanan kontrollü hata."""


class BaseLLMProvider(ABC):
    provider_name: str

    @abstractmethod
    async def generate_summary(
        self,
        text: str,
    ) -> SummaryResponse:
        """Verilen metin için özet ve önemli noktalar üretir."""


class LocalSummaryProvider(BaseLLMProvider):
    """Harici API gerektirmeyen deterministik özet sağlayıcısı."""

    provider_name = "local"

    async def generate_summary(
        self,
        text: str,
    ) -> SummaryResponse:
        cleaned_text = " ".join(text.split())

        if not cleaned_text:
            raise ValueError("Özetlenecek metin boş olamaz.")

        sentences = [
            sentence.strip()
            for sentence in re.split(
                r"(?<=[.!?])\s+",
                cleaned_text,
            )
            if sentence.strip()
        ]

        if not sentences:
            sentences = [cleaned_text]

        selected_sentences = sentences[:3]
        summary = " ".join(selected_sentences)[:2_000]

        key_point_items = []

        for index, sentence in enumerate(
            selected_sentences,
            start=1,
        ):
            title_words = sentence.split()[:8]
            title = " ".join(title_words)

            key_point_items.append(
                KeyPoint(
                    title=title[:150] or f"Önemli Nokta {index}",
                    description=sentence[:1_000],
                )
            )

        return SummaryResponse(
            summary=summary,
            key_points=KeyPoints(
                points=key_point_items,
            ),
        )


class GeminiSummaryProvider(BaseLLMProvider):
    """Gemini API kullanarak yapılandırılmış belge özeti üretir."""

    provider_name = "gemini"

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout_seconds: int,
        max_input_chars: int,
    ) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._max_input_chars = max_input_chars

    async def generate_summary(
        self,
        text: str,
    ) -> SummaryResponse:
        cleaned_text = " ".join(text.split())

        if not cleaned_text:
            raise ValueError("Özetlenecek metin boş olamaz.")

        if len(cleaned_text) > self._max_input_chars:
            raise ValueError(
                "Özetlenecek metin izin verilen maksimum "
                f"{self._max_input_chars} karakteri aşıyor."
            )

        prompt = (
            "Aşağıdaki eğitim veya ders materyalini Türkçe olarak özetle. "
            "Özet açık, doğru, tekrar içermeyen ve öğrencinin kolayca "
            "anlayabileceği bir dilde olsun. Metindeki bilgilere sadık kal; "
            "metinde bulunmayan bilgi ekleme. Ayrıca 3 ile 5 arasında önemli "
            "nokta üret. Her önemli nokta kısa bir başlık ve açıklama içersin.\n\n"
            f"METİN:\n{cleaned_text}"
        )

        try:
            async with asyncio.timeout(self._timeout_seconds):
                response = await self._client.aio.models.generate_content(
                    model=self._model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=2_048,
                        response_mime_type="application/json",
                        response_schema=SummaryResponse,
                    ),
                )
        except TimeoutError as exc:
            raise LLMProviderError(
                "Gemini özetleme isteği zaman aşımına uğradı."
            ) from exc
        except Exception as exc:
            raise LLMProviderError(
                "Gemini servisine şu anda ulaşılamıyor."
            ) from exc

        parsed = response.parsed

        if isinstance(parsed, SummaryResponse):
            return parsed

        if parsed is not None:
            try:
                return SummaryResponse.model_validate(parsed)
            except ValueError as exc:
                raise LLMProviderError(
                    "Gemini geçersiz bir özet formatı döndürdü."
                ) from exc

        if response.text:
            try:
                return SummaryResponse.model_validate_json(response.text)
            except ValueError as exc:
                raise LLMProviderError(
                    "Gemini yanıtı doğrulanamadı."
                ) from exc

        raise LLMProviderError(
            "Gemini boş bir yanıt döndürdü."
        )