from pydantic import BaseModel, Field


class DocumentQuestion(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=5000,
        description="Question to answer using uploaded documents",
    )

    document_id: int | None = Field(
        default=None,
        gt=0,
        description="Optional PDF document to search",
    )

    conversation_id: int | None = Field(
        default=None,
        gt=0,
        description="Optional existing conversation to continue",
    )


class DocumentSource(BaseModel):
    document_id: int
    filename: str
    page_number: int
    score: float


class DocumentAnswer(BaseModel):
    answer: str
    sources: list[DocumentSource]
    conversation_id: int