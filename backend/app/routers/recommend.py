"""Recommendation router."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.recommend_service import get_destination_recommendations

router = APIRouter()


class RecommendRequest(BaseModel):
    interests: list[str] = []
    difficulty: str = "Moderate"
    budget_tier: str = "Mid-Range"
    travel_month: str = "October"
    num_days: int = 5


@router.post("")
async def recommend(body: RecommendRequest, db: AsyncSession = Depends(get_db)):
    return await get_destination_recommendations(
        db=db,
        interests=body.interests,
        difficulty=body.difficulty,
        budget_tier=body.budget_tier,
        travel_month=body.travel_month,
        num_days=body.num_days,
    )
