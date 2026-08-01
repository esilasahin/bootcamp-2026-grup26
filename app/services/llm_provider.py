import re
from abc import ABC, abstractmethod

from app.schemas.summary import (
    KeyPoint,
    KeyPoints,
    SummaryResponse,
)


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_summary(
        self,
        text: str,
    ) -> SummaryResponse:
        """Verilen metin için özet ve önemli noktalar üretir."""


class LocalSummaryProvider(BaseLLMProvider):
    """
    Harici API anahtarı gerektirmeyen yerel ve deterministik özet sağlayıcısı.

    İleride Gemini veya OpenAI sağlayıcısı aynı BaseLLMProvider
    arayüzü kullanılarak eklenebilir.
    """

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