"""Budget prediction service."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.destination import Destination
from app.ml.budget_model import predict_budget


async def predict_trip_budget(
    db: AsyncSession,
    destination_id: str,
    num_days: int,
    hotel_type: str,
    interests: list[str],
    travel_month: str,
    num_travellers: int = 1,
) -> dict:
    # Fetch destination
    result = await db.execute(
        select(Destination).where(Destination.id == uuid.UUID(destination_id))
    )
    dest = result.scalar_one_or_none()
    if not dest:
        raise ValueError("Destination not found")

    return predict_budget(
        num_days=num_days,
        hotel_type=hotel_type,
        activity_count=len(interests),
        travel_month=travel_month,
        destination_base_price=dest.base_price_per_day or 3000,
        num_travellers=num_travellers,
    )
