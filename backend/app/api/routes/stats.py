
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import LearningStats as LearningStatsModel
from app.db.models import User
from app.schemas.stats import LearningStats as LearningStatsSchema
from app.core.security import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats", response_model=LearningStatsSchema)
def get_learning_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = (
        db.query(LearningStatsModel)
        .filter(LearningStatsModel.user_id == current_user.id)
        .first()
    )

    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Learning statistics have not been added yet.",
        )

    return stats


@router.put("/stats", response_model=LearningStatsSchema)
def update_learning_stats(
    updated_stats: LearningStatsSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = (
        db.query(LearningStatsModel)
        .filter(LearningStatsModel.user_id == current_user.id)
        .first()
    )

    if stats is None:
        stats = LearningStatsModel(user_id=current_user.id)
        db.add(stats)

    stats.lessons_completed = updated_stats.lessons_completed
    stats.study_hours = updated_stats.study_hours
    stats.quiz_average = updated_stats.quiz_average

    db.commit()
    db.refresh(stats)

    return stats
