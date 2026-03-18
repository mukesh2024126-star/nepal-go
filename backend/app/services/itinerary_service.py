"""Itinerary service."""
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.models.itinerary import Itinerary
from app.models.destination import Destination
from app.ml.scheduler import generate_schedule
from app.ml.budget_model import predict_budget


async def generate_itinerary(
    db: AsyncSession,
    destination_id: str,
    num_days: int,
    interests: list[str],
    difficulty: str,
    budget_tier: str,
    hotel_type: str,
    travel_month: str,
) -> dict:
    # Fetch destination with activities and hotels
    query = (
        select(Destination)
        .options(
            selectinload(Destination.activities),
            selectinload(Destination.hotels)
        )
        .where(Destination.id == uuid.UUID(destination_id))
    )
    result = await db.execute(query)
    dest = result.scalar_one_or_none()
    if not dest:
        raise ValueError("Destination not found")

    # Prepare activities data
    activities_data = [
        {
            "name": a.name,
            "category": a.category,
            "duration_hours": a.duration_hours,
            "difficulty": a.difficulty,
            "price_npr": a.price_npr or 0,
            "available_months": a.available_months or list(range(1, 13)),
        }
        for a in dest.activities
    ]

    # Prepare hotels data
    hotels_data = [
        {
            "name": h.name,
            "tier": h.tier,
            "price_per_night": h.price_per_night or 2000,
            "rating": h.rating or 3.0,
        }
        for h in dest.hotels
    ]

    # Generate schedule
    schedule = generate_schedule(
        destination_name=dest.name,
        num_days=num_days,
        interests=interests,
        difficulty=difficulty,
        hotel_type=hotel_type,
        travel_month=travel_month,
        activities=activities_data,
        hotels=hotels_data,
    )

    # Budget prediction
    budget_result = predict_budget(
        num_days=num_days,
        hotel_type=hotel_type,
        activity_count=len(interests),
        travel_month=travel_month,
        destination_base_price=dest.base_price_per_day or 3000,
        num_travellers=1,
    )

    return {
        "destination": dest.name,
        "destination_id": str(dest.id),
        "region": dest.region,
        "num_days": num_days,
        "travel_month": travel_month,
        "predicted_budget": budget_result["predicted_total"],
        "budget_breakdown": budget_result["breakdown"],
        "schedule": schedule,
    }


async def save_itinerary(
    db: AsyncSession,
    user_id: str,
    destination_id: str,
    destination_name: str,
    region: str | None,
    num_days: int,
    travel_month: str,
    budget_tier: str,
    hotel_type: str,
    interests: list[str],
    difficulty: str,
    predicted_budget: int,
    schedule: dict,
) -> dict:
    itin = Itinerary(
        user_id=uuid.UUID(user_id),
        destination_id=uuid.UUID(destination_id),
        destination_name=destination_name,
        region=region,
        num_days=num_days,
        travel_month=travel_month,
        budget_tier=budget_tier,
        hotel_type=hotel_type,
        interests=",".join(interests),
        difficulty=difficulty,
        predicted_budget=predicted_budget,
        actual_schedule=schedule,
    )
    db.add(itin)
    await db.commit()
    await db.refresh(itin)

    return {
        "id": str(itin.id),
        "destination_name": itin.destination_name,
        "region": itin.region,
        "num_days": itin.num_days,
        "travel_month": itin.travel_month,
        "predicted_budget": itin.predicted_budget,
        "status": itin.status,
        "schedule": itin.actual_schedule,
        "created_at": itin.created_at.isoformat() if itin.created_at else "",
    }


async def get_user_itineraries(db: AsyncSession, user_id: str) -> list[dict]:
    query = (
        select(Itinerary)
        .where(Itinerary.user_id == uuid.UUID(user_id))
        .order_by(desc(Itinerary.created_at))
    )
    result = await db.execute(query)
    itineraries = result.scalars().all()

    return [
        {
            "id": str(i.id),
            "destination_name": i.destination_name,
            "region": i.region,
            "num_days": i.num_days,
            "travel_month": i.travel_month,
            "predicted_budget": i.predicted_budget,
            "status": i.status,
            "created_at": i.created_at.isoformat() if i.created_at else "",
        }
        for i in itineraries
    ]


async def get_itinerary_detail(
    db: AsyncSession, itinerary_id: str, user_id: str
) -> dict | None:
    query = select(Itinerary).where(Itinerary.id == uuid.UUID(itinerary_id))
    result = await db.execute(query)
    itin = result.scalar_one_or_none()
    if not itin:
        return None
    if str(itin.user_id) != user_id:
        raise PermissionError("Not authorized to view this itinerary")

    return {
        "id": str(itin.id),
        "destination_name": itin.destination_name,
        "region": itin.region,
        "num_days": itin.num_days,
        "travel_month": itin.travel_month,
        "budget_tier": itin.budget_tier,
        "hotel_type": itin.hotel_type,
        "interests": itin.interests.split(",") if itin.interests else [],
        "difficulty": itin.difficulty,
        "predicted_budget": itin.predicted_budget,
        "actual_schedule": itin.actual_schedule,
        "status": itin.status,
        "created_at": itin.created_at.isoformat() if itin.created_at else "",
        "updated_at": itin.updated_at.isoformat() if itin.updated_at else "",
    }


async def delete_itinerary(
    db: AsyncSession, itinerary_id: str, user_id: str
) -> bool:
    query = select(Itinerary).where(Itinerary.id == uuid.UUID(itinerary_id))
    result = await db.execute(query)
    itin = result.scalar_one_or_none()
    if not itin:
        return False
    if str(itin.user_id) != user_id:
        raise PermissionError("Not authorized to delete this itinerary")
    await db.delete(itin)
    await db.commit()
    return True


async def update_status(
    db: AsyncSession, itinerary_id: str, user_id: str, status: str
) -> dict | None:
    valid_statuses = ["Upcoming", "Completed", "Cancelled"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

    query = select(Itinerary).where(Itinerary.id == uuid.UUID(itinerary_id))
    result = await db.execute(query)
    itin = result.scalar_one_or_none()
    if not itin:
        return None
    if str(itin.user_id) != user_id:
        raise PermissionError("Not authorized to update this itinerary")

    itin.status = status
    itin.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(itin)

    return {
        "id": str(itin.id),
        "status": itin.status,
        "updated_at": itin.updated_at.isoformat() if itin.updated_at else "",
    }
