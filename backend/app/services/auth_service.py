"""Authentication service."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.utils.password import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.ml.kmeans_cluster import predict_cluster

STYLE_SCORES = {
    "Adventure": {"adventure": 0.8, "nature": 0.5, "cultural": 0.2, "luxury": 0.1},
    "Cultural": {"cultural": 0.8, "nature": 0.4, "adventure": 0.3, "luxury": 0.2},
    "Nature": {"nature": 0.8, "adventure": 0.5, "cultural": 0.3, "luxury": 0.1},
    "Luxury": {"luxury": 0.9, "nature": 0.3, "cultural": 0.4, "adventure": 0.2},
}


async def register_user(
    db: AsyncSession,
    full_name: str,
    username: str,
    email: str,
    password: str,
    travel_style: str | None = None,
) -> dict:
    # Check existing email
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ValueError("Email already registered")

    # Check existing username
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        raise ValueError("Username already taken")

    # Scores
    scores = STYLE_SCORES.get(
        travel_style or "Nature", STYLE_SCORES["Nature"]
    )

    user = User(
        full_name=full_name,
        username=username,
        email=email,
        password_hash=hash_password(password),
        travel_style=travel_style,
        adventure_score=scores["adventure"],
        cultural_score=scores["cultural"],
        nature_score=scores["nature"],
        luxury_score=scores["luxury"],
    )

    # Cluster assignment
    try:
        cluster_id, cluster_label = predict_cluster([
            scores["adventure"], scores["cultural"],
            scores["nature"], scores["luxury"],
            0.5, 5  # default budget_level, trip_duration
        ])
        user.cluster_id = cluster_id
        user.cluster_label = cluster_label
    except Exception:
        user.cluster_id = 0
        user.cluster_label = "Explorer"

    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"user_id": str(user.id), "email": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_dict(user),
    }


async def login_user(db: AsyncSession, email: str, password: str) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("Invalid credentials")

    if not user.is_active:
        raise PermissionError("Account has been deactivated")

    token = create_access_token({"user_id": str(user.id), "email": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_dict(user),
    }


def _user_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "travel_style": user.travel_style,
        "cluster_label": user.cluster_label,
    }
