from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


MaterialKind = Literal["summary", "notes", "explanation", "quiz", "flashcards"]


class MaterialGenerateRequest(BaseModel):
    document_id: int = Field(gt=0)
    kind: MaterialKind
    topic: str | None = Field(default=None, max_length=255)


class StudyMaterialResponse(BaseModel):
    id: int
    document_id: int | None
    kind: MaterialKind
    title: str
    content: Any
    created_at: datetime


class QuizAttemptCreate(BaseModel):
    material_id: int = Field(gt=0)
    answers: list[str] = Field(min_length=1, max_length=50)


class QuizAttemptResponse(BaseModel):
    id: int
    material_id: int
    topic: str
    score: int
    created_at: datetime


class StudyPlanCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    subject: str = Field(min_length=1, max_length=255)
    scheduled_date: date
    duration_minutes: int = Field(ge=15, le=480)


class StudyPlanStatusUpdate(BaseModel):
    status: Literal["planned", "completed"]


class StudyPlanResponse(BaseModel):
    id: int
    title: str
    subject: str
    scheduled_date: date
    duration_minutes: int
    status: Literal["planned", "completed"]
    created_at: datetime
