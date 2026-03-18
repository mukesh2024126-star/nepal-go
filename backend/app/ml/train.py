"""
ML Training Script.
Run: python app/ml/train.py
"""
import sys
import os
import asyncio
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.ml.tfidf_engine import train_tfidf
from app.ml.kmeans_cluster import train_kmeans
from app.ml.budget_model import train_budget_model
from app.utils.seeder import generate_synthetic_users

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"


async def train_tfidf_from_db():
    """Load destinations from DB and train TF-IDF."""
    from app.database import async_session
    from app.models.destination import Destination
    from sqlalchemy import select

    async with async_session() as session:
        result = await session.execute(select(Destination))
        destinations = result.scalars().all()

        if not destinations:
            print("[Train] No destinations in DB. Reading from CSV...")
            return train_tfidf_from_csv()

        dest_data = []
        for d in destinations:
            dest_data.append({
                "id": str(d.id),
                "name": d.name,
                "description": d.description or "",
                "category": d.category or "",
                "tags": d.tags or [],
                "highlights": d.highlights or [],
                "best_season": d.best_season or "",
                "region": d.region or "",
                "difficulty": d.difficulty or "",
            })

        count = train_tfidf(dest_data)
        print(f"[Train] TF-IDF trained on {count} destinations from DB.")


def train_tfidf_from_csv():
    """Fallback: train from CSV file."""
    import csv
    csv_path = DATA_DIR / "destinations.csv"
    if not csv_path.exists():
        print("[Train] destinations.csv not found!")
        return

    destinations = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            destinations.append({
                "id": str(i),
                "name": row.get("name", ""),
                "description": row.get("description", ""),
                "category": row.get("category", ""),
                "tags": row.get("tags", "").split(",") if row.get("tags") else [],
                "highlights": row.get("highlights", "").split("|") if row.get("highlights") else [],
                "best_season": row.get("best_season", ""),
                "region": row.get("region", ""),
                "difficulty": row.get("difficulty", ""),
            })

    count = train_tfidf(destinations)
    print(f"[Train] TF-IDF trained on {count} destinations from CSV.")


def ensure_synthetic_data():
    """Ensure users_synthetic.csv exists."""
    csv_path = DATA_DIR / "users_synthetic.csv"
    if not csv_path.exists():
        print("[Train] Generating users_synthetic.csv...")
        os.makedirs(DATA_DIR, exist_ok=True)
        import csv as csv_mod
        rows = generate_synthetic_users(2000)
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv_mod.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        print(f"[Train] Generated {len(rows)} synthetic user rows.")


async def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    print("=" * 60)
    print("NepalGo ML Training Script")
    print("=" * 60)

    # 1. TF-IDF
    print("\n[1/3] Training TF-IDF model...")
    try:
        await train_tfidf_from_db()
    except Exception as e:
        print(f"[Train] DB connection failed ({e}), falling back to CSV...")
        train_tfidf_from_csv()

    # 2. Ensure synthetic data
    ensure_synthetic_data()
    csv_path = str(DATA_DIR / "users_synthetic.csv")

    # 3. KMeans
    print("\n[2/3] Training K-Means clustering model...")
    train_kmeans(csv_path, n_clusters=4)

    # 4. Budget model
    print("\n[3/3] Training Budget prediction model...")
    train_budget_model(csv_path)

    print("\n" + "=" * 60)
    print("All models trained and saved successfully.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
