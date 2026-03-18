"""Destination service."""
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import selectinload

from app.models.destination import Destination
from app.models.review import Review
from app.models.user import User


async def list_destinations(
    db: AsyncSession,
    search: str | None = None,
    category: str | None = None,
    region: str | None = None,
    difficulty: str | None = None,
    season: int | None = None,
    budget_max: int | None = None,
    sort: str = "popular",
    page: int = 1,
    limit: int = 12,
) -> dict:
    limit = min(limit, 50)
    query = select(Destination)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Destination.name.ilike(pattern),
                Destination.description.ilike(pattern),
                Destination.tags.any(search.lower()),  # type: ignore[arg-type]
            )
        )

    if category:
        query = query.where(Destination.category == category)
    if region:
        query = query.where(Destination.region == region)
    if difficulty:
        query = query.where(Destination.difficulty == difficulty)
    if season:
        query = query.where(
            Destination.best_months.any(season)  # type: ignore[arg-type]
        )
    if budget_max:
        query = query.where(Destination.base_price_per_day <= budget_max)

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Sort
    if sort == "price_asc":
        query = query.order_by(asc(Destination.base_price_per_day))
    elif sort == "price_desc":
        query = query.order_by(desc(Destination.base_price_per_day))
    elif sort == "rating":
        query = query.order_by(desc(Destination.rating))
    else:  # popular
        query = query.order_by(desc(Destination.rating))

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    destinations = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit > 0 else 0,
        "destinations": [_dest_to_dict(d) for d in destinations],
    }


async def get_featured(db: AsyncSession) -> list[dict]:
    query = (
        select(Destination)
        .where(Destination.is_featured == True)  # noqa
        .order_by(desc(Destination.rating))
        .limit(6)
    )
    result = await db.execute(query)
    return [_dest_to_dict(d) for d in result.scalars().all()]


async def get_destination_by_slug(db: AsyncSession, slug: str) -> dict | None:
    query = (
        select(Destination)
        .options(selectinload(Destination.activities), selectinload(Destination.hotels))
        .where(Destination.slug == slug)
    )
    result = await db.execute(query)
    dest = result.scalar_one_or_none()
    if not dest:
        return None

    # Reviews
    review_q = (
        select(Review, User.full_name)
        .join(User, Review.user_id == User.id)
        .where(Review.destination_id == dest.id)
        .order_by(desc(Review.created_at))
        .limit(10)
    )
    review_result = await db.execute(review_q)
    reviews = []
    for review, full_name in review_result.all():
        initials = "".join(w[0].upper() for w in full_name.split() if w)
        reviews.append({
            "id": str(review.id),
            "user_full_name": full_name,
            "user_initials": initials,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at.strftime("%Y-%m-%d") if review.created_at else "",
        })

    # Average rating
    avg_q = select(
        func.avg(Review.rating), func.count(Review.id)
    ).where(Review.destination_id == dest.id)
    avg_result = await db.execute(avg_q)
    avg_row = avg_result.one()
    avg_rating = round(float(avg_row[0]), 1) if avg_row[0] else dest.rating
    review_count = avg_row[1] or dest.review_count

    d = _dest_to_dict(dest)
    d["activities"] = [
        {
            "id": str(a.id),
            "name": a.name,
            "category": a.category,
            "duration_hours": a.duration_hours,
            "difficulty": a.difficulty,
            "price_npr": a.price_npr,
            "description": a.description,
            "available_months": a.available_months,
        }
        for a in dest.activities
    ]
    d["hotels"] = [
        {
            "id": str(h.id),
            "name": h.name,
            "tier": h.tier,
            "price_per_night": h.price_per_night,
            "rating": h.rating,
            "description": h.description,
            "amenities": h.amenities,
        }
        for h in dest.hotels
    ]
    d["reviews"] = reviews
    d["average_rating"] = avg_rating
    d["review_count"] = review_count
    return d


def _dest_to_dict(d: Destination) -> dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "slug": d.slug,
        "region": d.region,
        "category": d.category,
        "description": d.description,
        "short_description": d.short_description,
        "highlights": d.highlights,
        "best_season": d.best_season,
        "best_months": d.best_months,
        "difficulty": d.difficulty,
        "min_days": d.min_days,
        "max_days": d.max_days,
        "base_price_per_day": d.base_price_per_day,
        "image_url": d.image_url,
        "rating": d.rating,
        "review_count": d.review_count,
        "latitude": d.latitude,
        "longitude": d.longitude,
        "tags": d.tags,
        "is_featured": d.is_featured,
    }
