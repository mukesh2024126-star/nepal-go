"""Itinerary router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.itinerary import (
    GenerateItineraryRequest,
    SaveItineraryRequest,
    UpdateStatusRequest,
)
from app.services.itinerary_service import (
    generate_itinerary,
    save_itinerary,
    get_user_itineraries,
    get_itinerary_detail,
    delete_itinerary,
    update_status,
)
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/generate")
async def generate(
    body: GenerateItineraryRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await generate_itinerary(
            db=db,
            destination_id=body.destination_id,
            num_days=body.num_days,
            interests=body.interests,
            difficulty=body.difficulty,
            budget_tier=body.budget_tier,
            hotel_type=body.hotel_type,
            travel_month=body.travel_month,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/save", status_code=status.HTTP_201_CREATED)
async def save(
    body: SaveItineraryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await save_itinerary(
        db=db,
        user_id=str(current_user.id),
        destination_id=body.destination_id,
        destination_name=body.destination_name,
        region=body.region,
        num_days=body.num_days,
        travel_month=body.travel_month,
        budget_tier=body.budget_tier,
        hotel_type=body.hotel_type,
        interests=body.interests,
        difficulty=body.difficulty,
        predicted_budget=body.predicted_budget,
        schedule=body.schedule,
    )


@router.get("")
async def list_itineraries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_user_itineraries(db, str(current_user.id))


@router.get("/{itinerary_id}")
async def get_detail(
    itinerary_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await get_itinerary_detail(db, itinerary_id, str(current_user.id))
        if not result:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        return result
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.delete("/{itinerary_id}")
async def delete(
    itinerary_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        success = await delete_itinerary(db, itinerary_id, str(current_user.id))
        if not success:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        return {"message": "Itinerary deleted"}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.patch("/{itinerary_id}/status")
async def patch_status(
    itinerary_id: str,
    body: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await update_status(db, itinerary_id, str(current_user.id), body.status)
        if not result:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        return result
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorized")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
