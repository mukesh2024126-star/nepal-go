"""
Seeder: Loads destinations, activities, and hotels from the raw dataset files
into the PostgreSQL database. Also generates the formatted CSV files for ML training.
"""
import os
import re
import csv
import random
import asyncio
import uuid
from pathlib import Path

import openpyxl  # type: ignore[import-untyped]
from sqlalchemy import select
from app.database import async_session
from app.models.destination import Destination
from app.models.activity import Activity
from app.models.hotel import Hotel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR.parent / "dataset"
DATA_DIR = BASE_DIR / "data"

# Province to region mapping
PROVINCE_REGION = {
    1: "Terai",    # Koshi
    2: "Terai",    # Madhesh
    3: "Hilly",    # Bagmati
    4: "Hilly",    # Gandaki
    5: "Hilly",    # Lumbini
    6: "Himalayan",  # Karnali
    7: "Terai",    # Sudurpashchim
}

# Tag to category mapping
CATEGORY_MAP = {
    "trekking": "Adventure",
    "hiking": "Adventure",
    "climbing": "Adventure",
    "paragliding": "Adventure",
    "bungee": "Adventure",
    "rafting": "Adventure",
    "canyoning": "Adventure",
    "rappelling": "Adventure",
    "adventure": "Adventure",
    "biking": "Adventure",
    "cycling": "Adventure",
    "temple": "Cultural",
    "hindu": "Cultural",
    "buddhist": "Cultural",
    "monastery": "Cultural",
    "gumba": "Cultural",
    "heritage": "Cultural",
    "cultural": "Cultural",
    "culture": "Cultural",
    "stupa": "Cultural",
    "museum": "Cultural",
    "palace": "Cultural",
    "sculpture": "Cultural",
    "art": "Cultural",
    "history": "Cultural",
    "historical": "Cultural",
    "religious": "Spiritual",
    "pilgrimage": "Spiritual",
    "wildlife": "Wildlife",
    "safari": "Wildlife",
    "national park": "Wildlife",
    "zoo": "Wildlife",
    "forest": "Nature",
    "lake": "Nature",
    "waterfall": "Nature",
    "river": "Nature",
    "garden": "Nature",
    "pond": "Nature",
    "scenery": "Nature",
    "mountain": "Nature",
    "mountains": "Nature",
    "hills": "Nature",
    "hill": "Nature",
    "nature": "Nature",
    "rhododendron": "Nature",
    "cave": "Nature",
    "wetland": "Nature",
    "nightlife": "Luxury",
    "casino": "Luxury",
    "spa": "Luxury",
}


# Difficulty based on scores
def determine_difficulty(adventure_score, culture_score):
    if adventure_score >= 4:
        return "Challenging"
    elif adventure_score >= 2:
        return "Moderate"
    return "Easy"


# Best months from category
def determine_best_months(category, region):
    if category == "Adventure":
        return [3, 4, 5, 9, 10, 11]
    elif category == "Cultural":
        return [1, 2, 3, 4, 5, 9, 10, 11, 12]
    elif category == "Wildlife":
        return [1, 2, 3, 10, 11, 12]
    elif category == "Nature":
        return [3, 4, 5, 9, 10, 11]
    elif category == "Spiritual":
        return [1, 2, 3, 4, 5, 9, 10, 11, 12]
    return [3, 4, 5, 9, 10, 11]


def determine_best_season(best_months):
    if set([3, 4, 5]).issubset(set(best_months)):
        return "Spring (Mar-May) and Autumn (Sep-Nov)"
    return "Autumn (Sep-Nov)"


def determine_base_price(category, difficulty, region):
    base = 3000
    if category == "Adventure":
        base = 5000
    elif category == "Luxury":
        base = 8000
    elif category == "Wildlife":
        base = 4000
    if difficulty == "Challenging":
        base = int(base * 1.5)
    if region == "Himalayan":
        base = int(base * 1.3)
    return base


def determine_min_max_days(category, difficulty):
    if category == "Adventure" and difficulty == "Challenging":
        return 5, 14
    elif category == "Adventure":
        return 3, 7
    elif category == "Wildlife":
        return 2, 5
    elif category == "Cultural":
        return 1, 4
    elif category == "Spiritual":
        return 1, 3
    return 2, 5


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


def determine_category(tags_str, adventure, culture, wildlife, sightseeing, history):
    tags_lower = [t.strip().lower() for t in tags_str.split(",")] if tags_str else []
    # Score-based primary category
    scores: dict[str, float] = {
        "Adventure": adventure or 0,
        "Cultural": (culture or 0) + (history or 0) * 0.5,
        "Wildlife": wildlife or 0,
        "Nature": sightseeing or 0,
    }
    # Also check tags
    for tag in tags_lower:
        cat = CATEGORY_MAP.get(tag)
        if cat and cat in scores:
            scores[cat] += 2
        elif cat == "Spiritual":
            scores["Cultural"] += 1
    best_cat = max(scores, key=lambda k: scores[k])
    if scores[best_cat] == 0:
        best_cat = "Nature"
    return best_cat


def generate_description(name, category, region, tags_str):
    tags = [t.strip() for t in tags_str.split(",")] if tags_str else []
    tag_text = ", ".join(tags[:4]) if tags else "scenic views"
    return (
        f"{name} is a popular {category.lower()} destination in the {region} region of Nepal. "
        f"Known for its {tag_text}, it offers visitors an authentic Nepali experience. "
        f"This destination is ideal for travellers seeking {category.lower()} experiences."
    )


def generate_short_desc(name, category):
    return f"Explore {name} — a beautiful {category.lower()} destination in Nepal."


def create_highlights(tags_str, category):
    tags = [t.strip().title() for t in tags_str.split(",")] if tags_str else []
    highlights = tags[:5]
    if category == "Adventure" and "Trekking" not in highlights:
        highlights.append("Mountain Views")
    if category == "Cultural" and "Heritage Sites" not in highlights:
        highlights.append("Heritage Sites")
    return highlights if highlights else ["Scenic Views", "Local Culture"]


# ── ACTIVITY GENERATION ──

ACTIVITY_TEMPLATES = {
    "Adventure": [
        ("Mountain Trekking", "Adventure", 4, "Moderate", 1500, "Trek through mountain trails"),
        ("Sunrise Hike", "Adventure", 3, "Moderate", 500, "Early morning hike to viewpoint"),
        ("Rock Climbing", "Adventure", 3, "Challenging", 2000, "Guided rock climbing session"),
        ("River Crossing", "Adventure", 2, "Moderate", 800, "Cross a suspension bridge"),
        ("Mountain Biking", "Adventure", 4, "Challenging", 2500, "Mountain biking trail ride"),
        ("Camping Experience", "Adventure", 8, "Moderate", 3000, "Overnight camping in nature"),
    ],
    "Cultural": [
        ("Temple Visit", "Cultural", 2, "Easy", 300, "Visit the historic temple complex"),
        ("Heritage Walk", "Cultural", 3, "Easy", 200, "Guided heritage walking tour"),
        ("Cultural Dance Show", "Cultural", 2, "Easy", 500, "Traditional Nepali dance performance"),
        ("Pottery Workshop", "Cultural", 2, "Easy", 800, "Learn traditional Nepali pottery"),
        ("Local Market Tour", "Cultural", 2, "Easy", 0, "Explore local market and shops"),
        ("Museum Visit", "Cultural", 2, "Easy", 400, "Visit the local museum"),
    ],
    "Wildlife": [
        ("Jungle Safari", "Wildlife", 4, "Moderate", 3500, "Jeep safari in the national park"),
        ("Bird Watching", "Wildlife", 3, "Easy", 500, "Guided bird watching tour"),
        ("Canoe Ride", "Wildlife", 2, "Easy", 800, "Canoe ride through the river"),
        ("Elephant Safari", "Wildlife", 3, "Easy", 2500, "Elephant-back safari in the jungle"),
        ("Nature Walk", "Nature", 2, "Easy", 300, "Guided walk through the forest"),
        ("Wildlife Photography Tour", "Wildlife", 4, "Moderate", 1500, "Photography tour in jungle"),
    ],
    "Nature": [
        ("Lake Boating", "Nature", 2, "Easy", 500, "Boating on the scenic lake"),
        ("Waterfall Visit", "Nature", 3, "Easy", 0, "Visit to nearby waterfall"),
        ("Nature Photography", "Nature", 3, "Easy", 0, "Photography at scenic viewpoints"),
        ("Village Walk", "Nature", 2, "Easy", 0, "Walk through traditional villages"),
        ("Viewpoint Visit", "Nature", 1.5, "Easy", 0, "Visit scenic viewpoint"),
        ("Garden Tour", "Nature", 2, "Easy", 200, "Visit to botanical garden or park"),
    ],
    "Spiritual": [
        ("Meditation Session", "Spiritual", 2, "Easy", 500, "Guided meditation at temple"),
        ("Prayer Ceremony", "Spiritual", 1.5, "Easy", 0, "Participate in prayer ceremony"),
        ("Monastery Visit", "Spiritual", 2, "Easy", 300, "Visit and learn about the monastery"),
        ("Pilgrimage Walk", "Spiritual", 3, "Easy", 0, "Walk the pilgrimage route"),
    ],
}


def generate_activities_for_destination(dest_name, category, difficulty, best_months):
    templates = ACTIVITY_TEMPLATES.get(category, ACTIVITY_TEMPLATES["Nature"])
    activities = []
    # City orientation is always first
    activities.append({
        "destination_name": dest_name,
        "name": f"{dest_name} Orientation Walk",
        "category": "Sightseeing",
        "duration_hours": 2,
        "difficulty": "Easy",
        "price_npr": 0,
        "description": f"Introductory walking tour of {dest_name}",
        "available_months": best_months,
    })
    for template in templates:
        act_name, act_cat, duration, act_diff, price, desc = template
        activities.append({
            "destination_name": dest_name,
            "name": f"{act_name} - {dest_name}",
            "category": act_cat,
            "duration_hours": duration,
            "difficulty": act_diff,
            "price_npr": price,
            "description": f"{desc} at {dest_name}",
            "available_months": best_months,
        })
    return activities


# ── HOTEL CLASSIFICATION ──

def classify_hotel_tier(price_npr):
    if price_npr < 5000:
        return "Budget"
    elif price_npr < 20000:
        return "Mid-Range"
    return "Luxury"


def parse_hotel_price(price_str):
    """Parse 'NPR 6,605' to integer 6605."""
    cleaned = price_str.replace("NPR", "").replace(",", "").strip()
    try:
        return int(float(cleaned))
    except ValueError:
        return 5000


# ── HOTEL CITY → DESTINATION MATCHING ──

CITY_DESTINATION_MAP = {
    "Kathmandu": "Kathmandu",
    "Pokhara": "Pokhara",
    "Chitwan": "Chitwan",
    "Lumbini": "Lumbini",
    "Bhaktapur": "Bhaktapur",
    "Patan": "Patan",
    "Nagarkot": "Nagarkot",
    "Bandipur": "Bandipur",
    "Janakpur": "Janakpur",
    "Lukla": "Lukla",
    "Jomsom": "Jomsom",
}


# ── SYNTHETIC USERS GENERATION ──

def generate_synthetic_users(n=2000):
    random.seed(42)
    rows = []
    for _ in range(n):
        adventure = round(random.uniform(0, 1), 2)
        cultural = round(random.uniform(0, 1), 2)
        nature = round(random.uniform(0, 1), 2)
        luxury = round(random.uniform(0, 1), 2)
        budget_level = round(random.uniform(0, 1), 2)
        trip_dur = random.choice([3, 5, 7, 10, 14])
        num_days = random.choice([3, 4, 5, 7, 10])
        hotel_enc = random.choice([0, 1, 2])
        activity_count = random.randint(1, 6)
        season_enc = random.choice([0, 1, 2])
        base_price = random.choice([2000, 3000, 4000, 5000, 6000, 8000, 10000])
        num_travellers = random.choice([1, 2, 3, 4])

        # Total cost calculation
        hotel_cost = [1500, 3500, 8000][hotel_enc] * num_days
        activity_cost = activity_count * random.randint(300, 2000)
        transport = num_days * random.randint(500, 2000)
        meals = num_days * random.randint(500, 1500)
        base_total = hotel_cost + activity_cost + transport + meals
        season_mult = [0.8, 1.0, 1.3][season_enc]
        total = int(base_total * season_mult * (0.8 + 0.4 * budget_level) * num_travellers)

        rows.append({
            "adventure_score": adventure,
            "cultural_score": cultural,
            "nature_score": nature,
            "luxury_score": luxury,
            "budget_level": budget_level,
            "trip_duration_preference": trip_dur,
            "num_days": num_days,
            "hotel_type_encoded": hotel_enc,
            "activity_count": activity_count,
            "season_encoded": season_enc,
            "destination_base_price": base_price,
            "num_travellers": num_travellers,
            "total_cost_npr": total,
        })
    return rows


async def seed_database():
    """Main seeder function."""
    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(Destination).limit(1))
        if result.scalar_one_or_none() is not None:
            print("[Seeder] Destinations already exist, skipping seed.")
            return

        print("[Seeder] Starting database seed...")

        # ── 1. Read Excel data ──
        xlsx_path = DATASET_DIR / "data.xlsx"
        if not xlsx_path.exists():
            print(f"[Seeder] ERROR: {xlsx_path} not found!")
            return

        wb = openpyxl.load_workbook(xlsx_path)
        ws = wb["Sheet1"]

        destinations_data = []
        all_activities = []
        dest_name_to_id = {}
        seen_slugs = set()

        for row in ws.iter_rows(min_row=2, values_only=True):
            pid, name, culture, adventure, wildlife, sightseeing, history, tags, province = row
            if not name:
                continue
            name = str(name).strip()
            province = int(str(province)) if province else 3
            region = PROVINCE_REGION.get(province, "Hilly")
            tags_str = str(tags) if tags else ""
            culture = culture or 0
            adventure = adventure or 0
            wildlife = wildlife or 0
            sightseeing = sightseeing or 0
            history = history or 0

            category = determine_category(tags_str, adventure, culture, wildlife, sightseeing, history)
            difficulty = determine_difficulty(adventure, culture)
            best_months = determine_best_months(category, region)
            best_season = determine_best_season(best_months)
            base_price = determine_base_price(category, difficulty, region)
            min_d, max_d = determine_min_max_days(category, difficulty)

            slug = slugify(name)
            # Make slug unique
            orig_slug = slug
            counter = 1
            while slug in seen_slugs:
                slug = f"{orig_slug}-{counter}"
                counter += 1
            seen_slugs.add(slug)

            tag_list = [t.strip().lower() for t in tags_str.split(",") if t.strip()]
            highlights = create_highlights(tags_str, category)
            description = generate_description(name, category, region, tags_str)
            short_desc = generate_short_desc(name, category)

            dest_id = uuid.uuid4()
            dest_name_to_id[name] = dest_id

            # Featured: top places by name
            featured_names = [
                "Kathmandu", "Pokhara", "Chitwan", "Lumbini", "Bhaktapur",
                "Nagarkot", "Everest", "Annapurna", "Patan", "Bandipur",
            ]
            is_featured = any(fn.lower() in name.lower() for fn in featured_names)

            destinations_data.append({
                "id": dest_id,
                "name": name,
                "slug": slug,
                "region": region,
                "category": category,
                "description": description,
                "short_description": short_desc,
                "highlights": highlights,
                "best_season": best_season,
                "best_months": best_months,
                "difficulty": difficulty,
                "min_days": min_d,
                "max_days": max_d,
                "base_price_per_day": base_price,
                "image_url": f"/images/destinations/{slug}.jpg",
                "rating": round(random.uniform(3.5, 5.0), 1),
                "review_count": random.randint(5, 150),
                "latitude": round(random.uniform(26.5, 29.5), 4),
                "longitude": round(random.uniform(80.0, 88.0), 4),
                "tags": tag_list,
                "is_featured": is_featured,
            })

            # Generate activities for this destination
            acts = generate_activities_for_destination(name, category, difficulty, best_months)
            for act in acts:
                act["destination_id"] = dest_id
            all_activities.extend(acts)

        # ── 2. Insert destinations ──
        for d in destinations_data:
            dest = Destination(**d)
            session.add(dest)
        await session.flush()
        print(f"[Seeder] Inserted {len(destinations_data)} destinations.")

        # ── 3. Insert activities ──
        for act in all_activities:
            act.pop("destination_name", None)
            session.add(Activity(**act))
        await session.flush()
        print(f"[Seeder] Inserted {len(all_activities)} activities.")

        # ── 4. Read hotels CSV and insert ──
        hotel_csv = DATASET_DIR / "hotels.csv"
        hotel_count = 0
        if hotel_csv.exists():
            # We need to map hotel cities to destination IDs
            # First build a map from destination name (lowercase) to dest id
            dest_lower_to_id = {}
            for d in destinations_data:
                dest_lower_to_id[d["name"].lower()] = d["id"]

            with open(hotel_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    city = row.get("city", "").strip()
                    dest_name_match = CITY_DESTINATION_MAP.get(city)
                    if not dest_name_match:
                        continue

                    # Find destination by name
                    dest_id = None
                    for d in destinations_data:
                        if d["name"].lower() == dest_name_match.lower():
                            dest_id = d["id"]
                            break
                    if dest_id is None:
                        # Try partial match
                        for d in destinations_data:
                            if dest_name_match.lower() in d["name"].lower():
                                dest_id = d["id"]
                                break
                    if dest_id is None:
                        continue

                    price = parse_hotel_price(row.get("price", "5000"))
                    tier = classify_hotel_tier(price)
                    hotel_name = row.get("hotel_id", "Hotel").replace("-", " ").title()

                    amenities = (
                        ["WiFi", "Hot Water"] if tier == "Budget"
                        else ["WiFi", "Hot Water", "Restaurant", "Room Service"] if tier == "Mid-Range"
                        else ["WiFi", "Hot Water", "Restaurant", "Room Service", "Spa", "Pool"]
                    )

                    hotel = Hotel(
                        destination_id=dest_id,
                        name=hotel_name,
                        tier=tier,
                        price_per_night=price,
                        rating=round(random.uniform(3.0, 5.0), 1),
                        description=f"{hotel_name} in {city}",
                        amenities=amenities,
                    )
                    session.add(hotel)
                    hotel_count += 1

            await session.flush()
            print(f"[Seeder] Inserted {hotel_count} hotels.")
        else:
            print("[Seeder] Hotels CSV not found, skipping hotels.")

        await session.commit()
        print("[Seeder] Database seed complete!")

        # ── 5. Generate CSV files for ML ──
        os.makedirs(DATA_DIR, exist_ok=True)

        # destinations.csv
        with open(DATA_DIR / "destinations.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "name", "slug", "region", "category", "description", "short_description",
                "highlights", "best_season", "best_months", "difficulty", "min_days",
                "max_days", "base_price_per_day", "image_url", "latitude", "longitude",
                "tags", "is_featured",
            ])
            for d in destinations_data:
                writer.writerow([
                    d["name"], d["slug"], d["region"], d["category"],
                    d["description"], d["short_description"],
                    "|".join(d["highlights"]), d["best_season"],
                    ",".join(str(m) for m in d["best_months"]),
                    d["difficulty"], d["min_days"], d["max_days"],
                    d["base_price_per_day"], d["image_url"],
                    d["latitude"], d["longitude"],
                    ",".join(d["tags"]), d["is_featured"],
                ])
        print("[Seeder] Wrote data/destinations.csv")

        # activities.csv
        with open(DATA_DIR / "activities.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "destination_name", "name", "category", "duration_hours",
                "difficulty", "price_npr", "description", "available_months",
            ])
            for act in all_activities:
                writer.writerow([
                    "dest", act["name"], act["category"], act["duration_hours"],
                    act["difficulty"], act["price_npr"], act["description"],
                    ",".join(str(m) for m in act["available_months"]),
                ])
        print("[Seeder] Wrote data/activities.csv")

        # hotels.csv
        # (Already have the raw CSV, this is formatted version)
        with open(DATA_DIR / "hotels.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "destination_name", "name", "tier", "price_per_night",
                "rating", "description", "amenities",
            ])
        print("[Seeder] Wrote data/hotels.csv")

        # users_synthetic.csv
        synth = generate_synthetic_users(2000)
        with open(DATA_DIR / "users_synthetic.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=synth[0].keys())
            writer.writeheader()
            writer.writerows(synth)
        print(f"[Seeder] Wrote data/users_synthetic.csv with {len(synth)} rows.")


if __name__ == "__main__":
    asyncio.run(seed_database())
