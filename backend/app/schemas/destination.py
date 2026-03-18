from pydantic import BaseModel
from typing import Optional


class DestinationQuery(BaseModel):
    search: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    difficulty: Optional[str] = None
    season: Optional[int] = None
    budget_max: Optional[int] = None
    sort: str = "popular"
    page: int = 1
    limit: int = 12


class DestinationOut(BaseModel):
    id: str
    name: str
    slug: str
    region: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    highlights: Optional[list[str]] = None
    best_season: Optional[str] = None
    best_months: Optional[list[int]] = None
    difficulty: Optional[str] = None
    min_days: Optional[int] = None
    max_days: Optional[int] = None
    base_price_per_day: Optional[int] = None
    image_url: Optional[str] = None
    rating: float = 0
    review_count: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    tags: Optional[list[str]] = None
    is_featured: bool = False

    class Config:
        from_attributes = True


class DestinationListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    destinations: list[DestinationOut]
