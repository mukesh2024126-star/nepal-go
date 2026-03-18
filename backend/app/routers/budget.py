"""Budget router."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.budget_service import predict_trip_budget

router = APIRouter()


class BudgetRequest(BaseModel):
    destination_id: str
    num_days: int
    hotel_type: str = "Mid-Range"
    interests: list[str] = []
    travel_month: str = "October"
    num_travellers: int = 1


@router.post("/predict")
async def predict(body: BudgetRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await predict_trip_budget(
            db=db,
            destination_id=body.destination_id,
            num_days=body.num_days,
            hotel_type=body.hotel_type,
            interests=body.interests,
            travel_month=body.travel_month,
            num_travellers=body.num_travellers,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
