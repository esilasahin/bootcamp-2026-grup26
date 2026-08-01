from pydantic import BaseModel, ConfigDict, Field


class KeyPoint(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=150,
        description="Başlık veya kısa tanım",
    )
    description: str = Field(
        min_length=1,
        max_length=1_000,
        description="Önemli noktanın açıklaması",
    )


class KeyPoints(BaseModel):
    points: list[KeyPoint] = Field(
        default_factory=list,
        description="Önemli noktalar listesi",
    )


class SummaryRequest(BaseModel):
    document_id: int = Field(
        alias="documentId",
        gt=0,
        description="OCR sonucunun kaydedildiği belge kimliği",
    )
    text: str | None = Field(
        default=None,
        min_length=20,
        max_length=100_000,
        description=(
            "Opsiyonel ham metin. Gönderilmezse Document kaydındaki "
            "extracted_text kullanılır."
        ),
    )

    model_config = ConfigDict(populate_by_name=True)


class SummaryResultRead(BaseModel):
    analysis_result_id: int = Field(
        serialization_alias="analysisResultId",
    )
    document_id: int = Field(
        serialization_alias="documentId",
    )
    summary: str
    key_points: KeyPoints = Field(
        serialization_alias="keyPoints",
    )

    model_config = ConfigDict(populate_by_name=True)


class SummaryResponse(BaseModel):
    summary: str
    key_points: KeyPoints