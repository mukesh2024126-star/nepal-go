"""Recommendation service."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.destination import Destination
from app.ml.tfidf_engine import get_recommendations


MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}


async def get_destination_recommendations(
    db: AsyncSession,
    interests: list[str],
    difficulty: str = "Moderate",
    budget_tier: str = "Mid-Range",
    travel_month: str = "October",
    num_days: int = 5,
) -> dict:
    # Build query string
    query_text = (
        " ".join(interests)
        + " " + difficulty
        + " " + travel_month
        + " " + budget_tier
    )

    # Get TF-IDF recommendations
    raw_results = get_recommendations(query_text, top_n=20)

    if not raw_results:
        return {"recommendations": []}

    dest_ids = [r[0] for r in raw_results]
    score_map = {r[0]: r[1] for r in raw_results}

    # Fetch destinations
    dest_uuids = []
    for did in dest_ids:
        try:
            dest_uuids.append(uuid.UUID(did))
        except (ValueError, AttributeError):
            continue

    if not dest_uuids:
        return {"recommendations": []}

    result = await db.execute(
        select(Destination).where(Destination.id.in_(dest_uuids))
    )
    destinations = {str(d.id): d for d in result.scalars().all()}

    month_int = MONTH_MAP.get(travel_month.lower(), 10)

    recommendations = []
    for did in dest_ids:
        dest = destinations.get(did)
        if not dest:
            continue

        # Filter by num_days range
        if dest.min_days and dest.max_days:
            if num_days < dest.min_days or num_days > dest.max_days:
                continue

        # Filter by difficulty constraint
        if difficulty == "Easy" and dest.difficulty == "Challenging":
            continue

        similarity = score_map.get(did, 0)
        match_score = round(similarity * 100)

        # Build match reason
        reasons = []
        dest_tags = [t.lower() for t in (dest.tags or [])]
        dest_cat = (dest.category or "").lower()
        for interest in interests:
            if interest.lower() in dest_tags or interest.lower() in dest_cat:
                reasons.append(interest)
        if dest.best_months and month_int in dest.best_months:
            reasons.append(f"{travel_month} season")
        match_reason = (
            "Matched: " + ", ".join(reasons) if reasons else "General match"
        )

        recommendations.append({
            "destination": {
                "id": str(dest.id),
                "name": dest.name,
                "slug": dest.slug,
                "region": dest.region,
                "category": dest.category,
                "description": dest.description,
                "short_description": dest.short_description,
                "highlights": dest.highlights,
                "best_season": dest.best_season,
                "best_months": dest.best_months,
                "difficulty": dest.difficulty,
                "min_days": dest.min_days,
                "max_days": dest.max_days,
                "base_price_per_day": dest.base_price_per_day,
                "image_url": dest.image_url,
                "rating": dest.rating,
                "review_count": dest.review_count,
                "tags": dest.tags,
                "is_featured": dest.is_featured,
            },
            "match_score": match_score,
            "match_reason": match_reason,
        })

        if len(recommendations) >= 6:
            break

    return {"recommendations": recommendations}
