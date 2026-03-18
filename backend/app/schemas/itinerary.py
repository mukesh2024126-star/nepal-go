from pydantic import BaseModel
from typing import Optional


class GenerateItineraryRequest(BaseModel):
    destination_id: str
    num_days: int
    interests: list[str] = []
    difficulty: str = "Moderate"
    budget_tier: str = "Mid-Range"
    hotel_type: str = "Mid-Range"
    travel_month: str = "October"


class SaveItineraryRequest(BaseModel):
    destination_id: str
    destination_name: str
    region: Optional[str] = None
    num_days: int
    travel_month: str
    budget_tier: str
    hotel_type: str
    interests: list[str] = []
    difficulty: str
    predicted_budget: int
    schedule: dict


class UpdateStatusRequest(BaseModel):
    status: str


class ItineraryOut(BaseModel):
    id: str
    destination_name: Optional[str] = None
    region: Optional[str] = None
    num_days: Optional[int] = None
    travel_month: Optional[str] = None
    predicted_budget: Optional[int] = None
    status: str = "Upcoming"
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
