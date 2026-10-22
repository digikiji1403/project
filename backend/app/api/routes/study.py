import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.routes.stats import get_db
from app.core.security import get_current_user
from app.db.models import (
    Document,
    DocumentChunk,
    LearningStats,
    QuizAttempt,
    StudyMaterial,
    StudyPlanSession,
    User,
)
from app.schemas.study import (
    MaterialGenerateRequest,
    QuizAttemptCreate,
    StudyMaterialResponse,
    StudyPlanCreate,
    StudyPlanResponse,
    StudyPlanStatusUpdate,
)
from app.services.study_service import generate_material

router = APIRouter(tags=["Study tools"])
logger = logging.getLogger(__name__)


def _material_response(material: StudyMaterial):
    return {
        "id": material.id,
        "document_id": material.document_id,
        "kind": material.kind,
        "title": material.title,
        "content": json.loads(material.content),
        "created_at": material.created_at,
    }


@router.post(
    "/study/materials",
    response_model=StudyMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_material(
    payload: MaterialGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == payload.document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.status != "ready":
        raise HTTPException(
            status_code=409,
            detail="This document is not ready for study materials yet.",
        )

    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.chunk_index.asc())
        .limit(200)
        .all()
    )
    try:
        content = generate_material(document, chunks, payload.kind, payload.topic)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Study material generation failed for document %s", document.id)
        raise HTTPException(
            status_code=502,
            detail="Study material generation failed. Please try again.",
        ) from exc

    material_topic = (
        payload.topic.strip()
        if payload.topic and payload.topic.strip()
        else document.filename.rsplit(".", 1)[0]
    )
    material = StudyMaterial(
        user_id=current_user.id,
        document_id=document.id,
        kind=payload.kind,
        title=f"{payload.kind.title()} · {material_topic} — {document.filename}",
        content=json.dumps(content, ensure_ascii=False),
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return _material_response(material)


@router.get("/study/materials", response_model=list[StudyMaterialResponse])
def list_study_materials(
    kind: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StudyMaterial).filter(
        StudyMaterial.user_id == current_user.id
    )
    if kind is not None:
        if kind not in {"summary", "notes", "explanation", "quiz", "flashcards"}:
            raise HTTPException(status_code=422, detail="Invalid material kind.")
        query = query.filter(StudyMaterial.kind == kind)
    return [
        _material_response(item)
        for item in query.order_by(StudyMaterial.created_at.desc()).limit(limit).all()
    ]


@router.post(
    "/study/quiz-attempts",
    status_code=status.HTTP_201_CREATED,
)
def record_quiz_attempt(
    payload: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = (
        db.query(StudyMaterial)
        .filter(
            StudyMaterial.id == payload.material_id,
            StudyMaterial.user_id == current_user.id,
        )
        .first()
    )
    if material is None:
        raise HTTPException(status_code=404, detail="Study material not found.")
    if material.kind != "quiz":
        raise HTTPException(status_code=409, detail="This material is not a quiz.")

    questions = json.loads(material.content)
    if not isinstance(questions, list) or len(payload.answers) != len(questions):
        raise HTTPException(
            status_code=422,
            detail="Submit one answer for every question in the quiz.",
        )
    correct_count = sum(
        answer == question["answer"]
        for answer, question in zip(payload.answers, questions)
    )
    score = round(correct_count / len(questions) * 100)
    topic = material.title.split(" · ", 1)[-1].split(" — ", 1)[0]
    attempt = QuizAttempt(
        user_id=current_user.id,
        material_id=material.id,
        topic=topic[:255],
        score=score,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {
        "id": attempt.id,
        "material_id": attempt.material_id,
        "topic": attempt.topic,
        "score": attempt.score,
        "created_at": attempt.created_at,
    }


@router.get("/analytics")
def get_learning_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(
            QuizAttempt.topic,
            func.avg(QuizAttempt.score).label("average_score"),
            func.count(QuizAttempt.id).label("attempt_count"),
        )
        .filter(QuizAttempt.user_id == current_user.id)
        .group_by(QuizAttempt.topic)
        .order_by(func.avg(QuizAttempt.score).asc())
        .all()
    )
    topic_performance = [
        {
            "topic": topic,
            "average_score": round(float(average_score), 1),
            "attempt_count": attempt_count,
        }
        for topic, average_score, attempt_count in attempts
    ]
    all_scores = (
        db.query(func.avg(QuizAttempt.score), func.count(QuizAttempt.id))
        .filter(QuizAttempt.user_id == current_user.id)
        .first()
    )
    stats = (
        db.query(LearningStats)
        .filter(LearningStats.user_id == current_user.id)
        .first()
    )
    weak_topics = [
        item["topic"]
        for item in topic_performance
        if item["average_score"] < 70
    ]
    recommendations = [
        f"Review {topic}; recent quiz accuracy is below 70%."
        for topic in weak_topics
    ]
    if not recommendations:
        recommendations.append(
            "Keep a steady study rhythm and take quizzes to uncover topics "
            "that need more review."
        )

    return {
        "lessons_completed": stats.lessons_completed if stats else 0,
        "study_hours": stats.study_hours if stats else 0,
        "quiz_average": (
            round(float(all_scores[0]), 1)
            if all_scores and all_scores[0] is not None
            else stats.quiz_average if stats else 0
        ),
        "quiz_attempts": all_scores[1] if all_scores else 0,
        "topic_performance": topic_performance,
        "strengths": [
            item["topic"]
            for item in topic_performance
            if item["average_score"] >= 80
        ],
        "weaknesses": weak_topics,
        "recommendations": recommendations,
    }


@router.get("/planner", response_model=list[StudyPlanResponse])
def list_study_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(StudyPlanSession)
        .filter(StudyPlanSession.user_id == current_user.id)
        .order_by(StudyPlanSession.scheduled_date.asc(), StudyPlanSession.id.asc())
        .all()
    )


@router.post(
    "/planner",
    response_model=StudyPlanResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_session(
    payload: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = payload.title.strip()
    subject = payload.subject.strip()
    if not title or not subject:
        raise HTTPException(
            status_code=422,
            detail="Session title and subject cannot be empty.",
        )
    session = StudyPlanSession(
        user_id=current_user.id,
        title=title,
        subject=subject,
        scheduled_date=payload.scheduled_date,
        duration_minutes=payload.duration_minutes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/planner/{session_id}", response_model=StudyPlanResponse)
def update_study_session(
    session_id: int,
    payload: StudyPlanStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(StudyPlanSession)
        .filter(
            StudyPlanSession.id == session_id,
            StudyPlanSession.user_id == current_user.id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found.")
    session.status = payload.status
    db.commit()
    db.refresh(session)
    return session
