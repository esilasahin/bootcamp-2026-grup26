from pydantic import BaseModel, Field
from typing import List

class KeyPoint(BaseModel):
    title: str = Field(..., description="Başlık veya kısa tanım")
    description: str = Field(..., description="Önemli noktanın açıklaması")

class KeyPoints(BaseModel):
    points: List[KeyPoint] = Field(..., description="Önemli noktalar listesi")

class SummaryResponse(BaseModel):
    summary: str = Field(..., description="Genel özet metni")
    key_points: KeyPoints = Field(..., description="Çıkarılan önemli noktalar")

class SummaryRequest(BaseModel):
    text: str = Field(..., description="Özetlenecek ham metin")
