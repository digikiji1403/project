
from pydantic import BaseModel, Field


class TutorQuestion(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=5000,
        description="The student's question for the AI tutor",
    )

    conversation_id: int | None = Field(
        default=None,
        gt=0,
        description="The conversation to continue, if one exists",
    )


class TutorAnswer(BaseModel):
    answer: str
    conversation_id: int
