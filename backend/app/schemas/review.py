from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    destination_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewOut(BaseModel):
    id: str
    user_full_name: str
    user_initials: str
    rating: int
    comment: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class ReviewsResponse(BaseModel):
    reviews: list[ReviewOut]
    average_rating: float
    total_reviews: int
