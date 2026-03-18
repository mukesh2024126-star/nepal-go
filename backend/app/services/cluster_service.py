"""Cluster service."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.ml.kmeans_cluster import predict_cluster


async def assign_cluster(
    db: AsyncSession,
    user: User,
    adventure_score: float,
    cultural_score: float,
    nature_score: float,
    luxury_score: float,
    budget_level: float = 0.5,
    trip_duration_preference: int = 5,
) -> dict:
    features = [
        adventure_score, cultural_score, nature_score,
        luxury_score, budget_level, trip_duration_preference,
    ]
    cluster_id, cluster_label = predict_cluster(features)

    user.adventure_score = adventure_score
    user.cultural_score = cultural_score
    user.nature_score = nature_score
    user.luxury_score = luxury_score
    user.cluster_id = cluster_id
    user.cluster_label = cluster_label

    await db.commit()
    await db.refresh(user)

    return {
        "cluster_id": cluster_id,
        "cluster_label": cluster_label,
        "scores": {
            "adventure": round(adventure_score * 100),
            "cultural": round(cultural_score * 100),
            "nature": round(nature_score * 100),
            "luxury": round(luxury_score * 100),
        },
    }


async def get_cluster_profile(db: AsyncSession, user_id: str) -> dict | None:
    import uuid
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        return None

    return {
        "cluster_id": user.cluster_id,
        "cluster_label": user.cluster_label,
        "scores": {
            "adventure": round((user.adventure_score or 0) * 100),
            "cultural": round((user.cultural_score or 0) * 100),
            "nature": round((user.nature_score or 0) * 100),
            "luxury": round((user.luxury_score or 0) * 100),
        },
    }
