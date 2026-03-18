from pydantic import BaseModel, Field
from typing import Optional


class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    travel_style: Optional[str] = None
    preferred_difficulty: Optional[str] = None
    preferred_budget_tier: Optional[str] = None
    cluster_label: Optional[str] = None
    scores: dict = {}
    stats: dict = {}
    member_since: Optional[str] = None


class UpdatePreferencesRequest(BaseModel):
    travel_style: Optional[str] = None
    preferred_difficulty: Optional[str] = None
    preferred_budget_tier: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
