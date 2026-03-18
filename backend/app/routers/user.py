"""User profile router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.schemas.user import UpdatePreferencesRequest, ChangePasswordRequest
from app.models.user import User
from app.models.itinerary import Itinerary
from app.models.saved_place import SavedPlace
from app.middleware.auth_middleware import get_current_user
from app.utils.password import verify_password, hash_password
from app.ml.kmeans_cluster import predict_cluster

router = APIRouter()

STYLE_SCORES = {
    "Adventure": {"adventure": 0.8, "nature": 0.5, "cultural": 0.2, "luxury": 0.1},
    "Cultural": {"cultural": 0.8, "nature": 0.4, "adventure": 0.3, "luxury": 0.2},
    "Nature": {"nature": 0.8, "adventure": 0.5, "cultural": 0.3, "luxury": 0.1},
    "Luxury": {"luxury": 0.9, "nature": 0.3, "cultural": 0.4, "adventure": 0.2},
}


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Compute stats dynamically
    trips_q = await db.execute(
        select(
            func.count(Itinerary.id),
            func.coalesce(func.sum(Itinerary.num_days), 0),
            func.coalesce(func.sum(Itinerary.predicted_budget), 0),
        ).where(Itinerary.user_id == current_user.id)
    )
    trips_row = trips_q.one()

    saved_q = await db.execute(
        select(func.count(SavedPlace.id)).where(SavedPlace.user_id == current_user.id)
    )
    saved_count = saved_q.scalar() or 0

    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "travel_style": current_user.travel_style,
        "preferred_difficulty": current_user.preferred_difficulty,
        "preferred_budget_tier": current_user.preferred_budget_tier,
        "cluster_label": current_user.cluster_label,
        "scores": {
            "adventure": round((current_user.adventure_score or 0) * 100),
            "cultural": round((current_user.cultural_score or 0) * 100),
            "nature": round((current_user.nature_score or 0) * 100),
            "luxury": round((current_user.luxury_score or 0) * 100),
        },
        "stats": {
            "trips_planned": trips_row[0],
            "days_explored": int(trips_row[1]),
            "total_budget_npr": int(trips_row[2]),
            "destinations_saved": saved_count,
        },
        "member_since": (
            current_user.created_at.strftime("%Y-%m-%d")
            if current_user.created_at else None
        ),
    }


@router.patch("/preferences")
async def update_preferences(
    body: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.travel_style is not None:
        current_user.travel_style = body.travel_style
        scores = STYLE_SCORES.get(body.travel_style, STYLE_SCORES["Nature"])
        current_user.adventure_score = scores["adventure"]
        current_user.cultural_score = scores["cultural"]
        current_user.nature_score = scores["nature"]
        current_user.luxury_score = scores["luxury"]
    if body.preferred_difficulty is not None:
        current_user.preferred_difficulty = body.preferred_difficulty
    if body.preferred_budget_tier is not None:
        current_user.preferred_budget_tier = body.preferred_budget_tier

    # Re-run cluster assignment
    try:
        cluster_id, cluster_label = predict_cluster([
            current_user.adventure_score or 0,
            current_user.cultural_score or 0,
            current_user.nature_score or 0,
            current_user.luxury_score or 0,
            0.5, 5,
        ])
        current_user.cluster_id = cluster_id
        current_user.cluster_label = cluster_label
    except Exception:
        pass

    await db.commit()
    await db.refresh(current_user)

    return {"message": "Preferences updated", "cluster_label": current_user.cluster_label}


@router.patch("/password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(body.new_password)
    await db.commit()

    return {"message": "Password changed successfully"}
