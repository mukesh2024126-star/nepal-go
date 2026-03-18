"""Saved places router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas.saved import SavePlaceRequest
from app.models.saved_place import SavedPlace
from app.models.destination import Destination
from app.models.user import User
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def save_place(
    body: SavePlaceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dest_id = uuid.UUID(body.destination_id)

    existing = await db.execute(
        select(SavedPlace).where(
            SavedPlace.user_id == current_user.id,
            SavedPlace.destination_id == dest_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Destination already saved")

    saved = SavedPlace(user_id=current_user.id, destination_id=dest_id)
    db.add(saved)
    await db.commit()

    return {"message": "Destination saved", "destination_id": body.destination_id}


@router.delete("/{destination_id}")
async def unsave_place(
    destination_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dest_id = uuid.UUID(destination_id)
    result = await db.execute(
        select(SavedPlace).where(
            SavedPlace.user_id == current_user.id,
            SavedPlace.destination_id == dest_id,
        )
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved place not found")

    await db.delete(saved)
    await db.commit()
    return {"message": "Destination unsaved"}


@router.get("")
async def get_saved(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedPlace, Destination)
        .join(Destination, SavedPlace.destination_id == Destination.id)
        .where(SavedPlace.user_id == current_user.id)
    )
    rows = result.all()

    return [
        {
            "id": str(sp.id),
            "saved_at": sp.saved_at.isoformat() if sp.saved_at else "",
            "destination": {
                "id": str(dest.id),
                "name": dest.name,
                "slug": dest.slug,
                "region": dest.region,
                "category": dest.category,
                "short_description": dest.short_description,
                "image_url": dest.image_url,
                "rating": dest.rating,
                "review_count": dest.review_count,
                "difficulty": dest.difficulty,
                "base_price_per_day": dest.base_price_per_day,
            },
        }
        for sp, dest in rows
    ]
