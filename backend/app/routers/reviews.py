"""Reviews router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.schemas.review import CreateReviewRequest
from app.models.review import Review
from app.models.destination import Destination
from app.models.user import User
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_review(
    body: CreateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dest_id = uuid.UUID(body.destination_id)

    # Check existing review
    existing = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.destination_id == dest_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already reviewed this destination")

    review = Review(
        user_id=current_user.id,
        destination_id=dest_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    await db.flush()

    # Recompute destination rating
    await _recompute_rating(db, dest_id)
    await db.commit()

    return {
        "id": str(review.id),
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else "",
    }


@router.get("/{destination_id}")
async def get_reviews(destination_id: str, db: AsyncSession = Depends(get_db)):
    dest_id = uuid.UUID(destination_id)

    result = await db.execute(
        select(Review, User.full_name)
        .join(User, Review.user_id == User.id)
        .where(Review.destination_id == dest_id)
        .order_by(desc(Review.created_at))
    )

    reviews = []
    for review, full_name in result.all():
        initials = "".join(w[0].upper() for w in full_name.split() if w)
        reviews.append({
            "id": str(review.id),
            "user_full_name": full_name,
            "user_initials": initials,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at.strftime("%Y-%m-%d") if review.created_at else "",
        })

    avg_result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.destination_id == dest_id)
    )
    avg_row = avg_result.one()

    return {
        "reviews": reviews,
        "average_rating": round(float(avg_row[0]), 1) if avg_row[0] else 0,
        "total_reviews": avg_row[1] or 0,
    }


@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(Review.id == uuid.UUID(review_id))
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    dest_id = review.destination_id
    await db.delete(review)
    await _recompute_rating(db, dest_id)
    await db.commit()

    return {"message": "Review deleted"}


async def _recompute_rating(db: AsyncSession, destination_id):
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.destination_id == destination_id)
    )
    row = result.one()
    avg_rating = round(float(row[0]), 1) if row[0] else 0
    review_count = row[1] or 0

    dest_result = await db.execute(
        select(Destination).where(Destination.id == destination_id)
    )
    dest = dest_result.scalar_one_or_none()
    if dest:
        dest.rating = avg_rating
        dest.review_count = review_count
