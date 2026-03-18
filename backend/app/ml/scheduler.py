"""
Rule-based itinerary scheduler.
Fully deterministic — same inputs always produce the same output.
"""
from datetime import datetime, timezone


MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

TIME_SLOTS = ["08:00", "11:00", "14:30"]


def generate_schedule(
    destination_name: str,
    num_days: int,
    interests: list[str],
    difficulty: str,
    hotel_type: str,
    travel_month: str,
    activities: list[dict],
    hotels: list[dict],
) -> dict:
    """
    Generate a deterministic day-by-day itinerary.

    activities: list of dicts with keys:
        name, category, duration_hours, difficulty, price_npr, available_months
    hotels: list of dicts with keys:
        name, tier, price_per_night, rating
    """
    month_int = MONTH_MAP.get(travel_month.lower(), 10)

    # ── Rule 3: Filter activities by travel month ──
    available_activities = [
        a for a in activities
        if month_int in (a.get("available_months") or list(range(1, 13)))
    ]

    # ── Rule 4: Filter activities by difficulty ──
    allowed_difficulties = _get_allowed_difficulties(difficulty)
    available_activities = [
        a for a in available_activities
        if (a.get("difficulty") or "Easy") in allowed_difficulties
    ]

    # ── Rule 5: Sort: prioritise matching interests, then others ──
    interests_lower = [i.lower() for i in interests]

    def interest_score(act):
        cat = (act.get("category") or "").lower()
        name = (act.get("name") or "").lower()
        score = 0
        for interest in interests_lower:
            if interest in cat or interest in name:
                score += 10
        return score

    # Separate orientation activities
    orientation_acts = [
        a for a in available_activities
        if _is_orientation(a)
    ]
    other_acts = [
        a for a in available_activities
        if not _is_orientation(a)
    ]

    # Sort other activities: interest match first, then by price (cheap first for variety)
    other_acts.sort(key=lambda a: (-interest_score(a), a.get("price_npr", 0)))

    # ── Rule 8: Hotel selection ──
    selected_hotel = _select_hotel(hotels, hotel_type)

    # ── Build daily schedule ──
    used_activities = set()
    days = []

    for day_num in range(1, num_days + 1):
        day_activities = []

        # ── Rule 9: Day 1 starts with orientation ──
        if day_num == 1 and orientation_acts:
            orient = orientation_acts[0]
            orient_name = orient.get("name", "Orientation")
            if orient_name not in used_activities:
                day_activities.append(orient)
                used_activities.add(orient_name)

        # Fill remaining slots (Rule 2: max 3 per day)
        for act in other_acts:
            if len(day_activities) >= 3:
                break
            act_name = act.get("name", "")
            if act_name not in used_activities:
                day_activities.append(act)
                used_activities.add(act_name)

        # ── Rule 7: Assign time slots ──
        activities_for_day = []
        for i, act in enumerate(day_activities[:3]):
            activities_for_day.append({
                "time": TIME_SLOTS[i],
                "name": act.get("name", "Activity"),
                "duration_hours": act.get("duration_hours", 2),
                "price_npr": act.get("price_npr", 0),
                "category": act.get("category", "General"),
            })

        # ── Rule 10: Compute daily total ──
        activity_total = sum(a["price_npr"] for a in activities_for_day)
        hotel_price = selected_hotel["price_per_night"] if selected_hotel else 0
        daily_total = activity_total + hotel_price

        days.append({
            "day_number": day_num,
            "location": destination_name,
            "hotel": selected_hotel,
            "activities": activities_for_day,
            "daily_total": daily_total,
        })

    total_budget = sum(d["daily_total"] for d in days)

    return {
        "days": days,
        "total_budget_calculated": total_budget,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _get_allowed_difficulties(requested: str) -> set:
    if requested == "Easy":
        return {"Easy"}
    elif requested == "Moderate":
        return {"Easy", "Moderate"}
    return {"Easy", "Moderate", "Challenging"}


def _is_orientation(activity: dict) -> bool:
    name = (activity.get("name") or "").lower()
    cat = (activity.get("category") or "").lower()
    price = activity.get("price_npr", 0)
    return (
        "orientation" in name
        or "city walk" in name
        or ("sightseeing" in cat and price == 0)
    )


def _select_hotel(hotels: list[dict], hotel_type: str) -> dict | None:
    if not hotels:
        return {"name": "Local Guesthouse", "tier": "Budget", "price_per_night": 1500}

    tier_priority = {
        "Budget": ["Budget", "Mid-Range"],
        "Mid-Range": ["Mid-Range", "Budget"],
        "Luxury": ["Luxury", "Mid-Range", "Budget"],
    }
    priority = tier_priority.get(hotel_type, ["Mid-Range", "Budget"])

    for tier in priority:
        tier_hotels = [h for h in hotels if h.get("tier") == tier]
        if tier_hotels:
            # Select highest rated
            best = max(tier_hotels, key=lambda h: h.get("rating", 0))
            return {
                "name": best.get("name", "Hotel"),
                "tier": best.get("tier", tier),
                "price_per_night": best.get("price_per_night", 2000),
            }

    # Fallback
    best = max(hotels, key=lambda h: h.get("rating", 0))
    return {
        "name": best.get("name", "Hotel"),
        "tier": best.get("tier", "Budget"),
        "price_per_night": best.get("price_per_night", 2000),
    }
