from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    full_name: str = Field(alias="fullName", min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_full_name(cls, value: Any) -> Any:
        """Trim display-name whitespace without altering the user's password."""
        return value.strip() if isinstance(value, str) else value


class UserRead(BaseModel):
    id: int
    full_name: str = Field(serialization_alias="fullName")
    email: EmailStr
    is_active: bool = Field(serialization_alias="isActive")
    created_at: datetime = Field(serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
