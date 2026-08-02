import asyncio
import re
from abc import ABC, abstractmethod

from google import genai
from google.genai import types

from app.schemas.study_quiz import (
    GeneratedQuizContent,
    GeneratedQuizQuestion,
)
from app.services.llm_provider import LLMProviderError


class BaseQuizProvider(ABC):
    provider_name: str

    @abstractmethod
    async def generate_quiz(
        self,
        *,
        topic: str,
        source_text: str,
        question_count: int,
    ) -> GeneratedQuizContent:
        """Konu ve kaynak metinden çoktan seçmeli quiz üretir."""


class LocalQuizProvider(BaseQuizProvider):
    provider_name = "local"

    async def generate_quiz(
        self,
        *,
        topic: str,
        source_text: str,
        question_count: int,
    ) -> GeneratedQuizContent:
        cleaned = " ".join(source_text.split()) or topic
        sentences = [
            item.strip()
            for item in re.split(r"(?<=[.!?])\s+", cleaned)
            if item.strip()
        ] or [topic]

        questions = []
        for index in range(question_count):
            fact = sentences[index % len(sentences)][:300]
            questions.append(
                GeneratedQuizQuestion(
                    question=f"{topic} konusunda doğru ifade hangisidir? ({index + 1})",
                    options=[
                        fact,
                        "Bu konu kaynak metinde ele alınmamıştır.",
                        "Yukarıdaki ifadelerin hiçbiri doğru değildir.",
                        "Konu yalnızca görsel tasarımla ilgilidir.",
                    ],
                    correct_index=0,
                    explanation=f"Kaynak metindeki ilgili ifade: {fact}",
                )
            )
        return GeneratedQuizContent(questions=questions)


class GeminiQuizProvider(BaseQuizProvider):
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

    async def generate_quiz(
        self,
        *,
        topic: str,
        source_text: str,
        question_count: int,
    ) -> GeneratedQuizContent:
        cleaned = " ".join(source_text.split())
        if not cleaned:
            cleaned = topic
        if len(cleaned) > self._max_input_chars:
            cleaned = cleaned[: self._max_input_chars]

        prompt = (
            f"'{topic}' konusunda Türkçe, tam {question_count} adet çoktan seçmeli "
            "quiz sorusu üret. Her soruda birbirinden farklı tam 4 seçenek olsun. "
            "Yalnızca bir seçenek doğru olsun. Sorular açık, öğretici ve kaynak "
            "metne sadık olsun. correct_index değeri 0 ile 3 arasında olmalı. "
            "Her soru için kısa bir Türkçe açıklama ekle.\n\n"
            f"KAYNAK METİN:\n{cleaned}"
        )

        try:
            async with asyncio.timeout(self._timeout_seconds):
                response = await self._client.aio.models.generate_content(
                    model=self._model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.4,
                        max_output_tokens=4_096,
                        response_mime_type="application/json",
                        response_schema=GeneratedQuizContent,
                    ),
                )
        except TimeoutError as exc:
            raise LLMProviderError("Gemini quiz isteği zaman aşımına uğradı.") from exc
        except Exception as exc:
            raise LLMProviderError("Gemini quiz servisine şu anda ulaşılamıyor.") from exc

        parsed = response.parsed
        try:
            if isinstance(parsed, GeneratedQuizContent):
                result = parsed
            elif parsed is not None:
                result = GeneratedQuizContent.model_validate(parsed)
            elif response.text:
                result = GeneratedQuizContent.model_validate_json(response.text)
            else:
                raise ValueError("Boş Gemini yanıtı")
        except ValueError as exc:
            raise LLMProviderError("Gemini geçersiz bir quiz formatı döndürdü.") from exc

        if len(result.questions) != question_count:
            raise LLMProviderError(
                "Gemini istenen soru sayısından farklı bir quiz döndürdü."
            )
        return result


def quiz_level(score: int) -> str:
    if score >= 80:
        return "advanced"
    if score >= 50:
        return "intermediate"
    return "beginner"
