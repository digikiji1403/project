
from pydantic import BaseModel, Field


class LearningStats(BaseModel):
    lessons_completed: int = Field(ge=0)
    study_hours: float = Field(ge=0)
    quiz_average: int = Field(ge=0, le=100)
