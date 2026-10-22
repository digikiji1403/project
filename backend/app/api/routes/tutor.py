
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.stats import get_db
from app.core.security import get_current_user
from app.db.models import ChatMessage, Conversation, User
from app.schemas.tutor import TutorQuestion, TutorAnswer
from app.services.ai_service import ask_tutor
from app.db.models import Document
from app.schemas.document_qa import DocumentQuestion, DocumentAnswer
from app.services.rag_service import answer_document_question
router = APIRouter(
    prefix="/tutor",
    tags=["AI Tutor"],
)


@router.post("/ask", response_model=TutorAnswer)
def ask_tutor_endpoint(
    payload: TutorQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Answer a question and save the exchange to PostgreSQL."""

    question = payload.question.strip()

    if not question:
        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty.",
        )

    conversation = None

    if payload.conversation_id is not None:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )

        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )
    else:
        conversation = Conversation(
            user_id=current_user.id,
            title=question[:60] or "New conversation",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    try:
        # Generate the answer before saving the message exchange.
        answer = ask_tutor(question)

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI tutor returned an empty answer.",
            )

        db.add_all(
            [
                ChatMessage(
                    conversation_id=conversation.id,
                    role="user",
                    content=question,
                ),
                ChatMessage(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=answer,
                ),
            ]
        )

        db.commit()
        db.refresh(conversation)

        return TutorAnswer(
            answer=answer,
            conversation_id=conversation.id,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="The AI tutor could not generate an answer. Please try again.",
        )



@router.post("/ask-document", response_model=DocumentAnswer)
def ask_document_endpoint(
    payload: DocumentQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Answer a question using the logged-in user's uploaded PDFs."""

    question = payload.question.strip()

    if not question:
        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty.",
        )

    # Verify ownership and readiness when a specific PDF is selected.
    if payload.document_id is not None:
        document = (
            db.query(Document)
            .filter(
                Document.id == payload.document_id,
                Document.user_id == current_user.id,
            )
            .first()
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        if document.status != "ready":
            raise HTTPException(
                status_code=409,
                detail="This document is not ready for questions yet.",
            )

    # Continue only a conversation owned by the current user.
    if payload.conversation_id is not None:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )

        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )
    else:
        conversation = Conversation(
            user_id=current_user.id,
            title=question[:60] or "Document question",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    try:
        result = answer_document_question(
            user_id=current_user.id,
            question=question,
            document_id=payload.document_id,
        )

        answer = result["answer"]

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty answer.",
            )

        db.add_all(
            [
                ChatMessage(
                    conversation_id=conversation.id,
                    role="user",
                    content=question,
                ),
                ChatMessage(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=answer,
                ),
            ]
        )

        db.commit()

        return DocumentAnswer(
            answer=answer,
            sources=result["sources"],
            conversation_id=conversation.id,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=(
                "Document question answering failed. "
                "Please try again."
            ),
        )
