"""Cluster router."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.cluster_service import assign_cluster, get_cluster_profile
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter()


class ClusterAssignRequest(BaseModel):
    adventure_score: float = 0.5
    cultural_score: float = 0.5
    nature_score: float = 0.5
    luxury_score: float = 0.5
    budget_level: float = 0.5
    trip_duration_preference: int = 5


@router.post("/assign")
async def assign(
    body: ClusterAssignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await assign_cluster(
        db=db,
        user=current_user,
        adventure_score=body.adventure_score,
        cultural_score=body.cultural_score,
        nature_score=body.nature_score,
        luxury_score=body.luxury_score,
        budget_level=body.budget_level,
        trip_duration_preference=body.trip_duration_preference,
    )


@router.get("/profile/{user_id}")
async def profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await get_cluster_profile(db, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result
