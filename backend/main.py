import os
import logging
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from app.ml.tfidf_engine import load_tfidf_models
from app.ml.kmeans_cluster import load_kmeans_model
from app.ml.budget_model import load_budget_model
from app.utils.seeder import seed_database
from app.database import async_session
from app.routers import (
    auth, destinations, itinerary,
    budget, recommend, cluster,
    reviews, saved, user, chat
)

load_dotenv()
logger = logging.getLogger("nepalgo")

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "replace_with_admin_secret")

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models
    load_tfidf_models()
    load_kmeans_model()
    load_budget_model()
    # Seed database
    try:
        await seed_database()
    except Exception as e:
        logger.warning(f"Seeder skipped or failed: {e}")
    yield


app = FastAPI(title="NepalGo API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler  # type: ignore[arg-type]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "status_code": exc.status_code},
        )
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500},
    )


# ── Include routers ──

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(
    destinations.router, prefix="/api/destinations", tags=["Destinations"]
)
app.include_router(recommend.router, prefix="/api/recommend", tags=["Recommend"])
app.include_router(budget.router, prefix="/api/budget", tags=["Budget"])
app.include_router(cluster.router, prefix="/api/cluster", tags=["Cluster"])
app.include_router(itinerary.router, prefix="/api/itinerary", tags=["Itinerary"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(saved.router, prefix="/api/saved", tags=["Saved"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


# ── Admin endpoints ──

def verify_admin_key(x_admin_key: str = Header(None)):
    if x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin API key")


@app.post("/api/admin/retrain", tags=["Admin"])
async def admin_retrain(x_admin_key: str = Header(None)):
    verify_admin_key(x_admin_key)
    from app.ml.train import train_tfidf_from_db, ensure_synthetic_data
    from app.ml.kmeans_cluster import train_kmeans
    from app.ml.budget_model import train_budget_model
    from pathlib import Path

    data_dir = Path(__file__).parent / "data"
    ensure_synthetic_data()
    csv_path = str(data_dir / "users_synthetic.csv")

    try:
        await train_tfidf_from_db()
    except Exception as e:
        logger.warning(f"TF-IDF retrain failed: {e}")

    sil = train_kmeans(csv_path, n_clusters=4)
    budget_metrics = train_budget_model(csv_path)

    load_tfidf_models()
    load_kmeans_model()
    load_budget_model()

    return {
        "message": "All models retrained",
        "kmeans_silhouette": round(sil, 4),
        "budget_r2": round(budget_metrics["r2"], 4),
        "budget_rmse": round(budget_metrics["rmse"], 2),
    }


@app.post("/api/admin/seed", tags=["Admin"])
async def admin_seed(x_admin_key: str = Header(None)):
    verify_admin_key(x_admin_key)
    await seed_database()
    return {"message": "Database seeded successfully"}


@app.get("/api/admin/stats", tags=["Admin"])
async def admin_stats(x_admin_key: str = Header(None)):
    verify_admin_key(x_admin_key)
    from sqlalchemy import select, func
    from app.models.user import User
    from app.models.destination import Destination
    from app.models.itinerary import Itinerary
    from app.models.review import Review

    async with async_session() as db:
        users = (await db.execute(select(func.count(User.id)))).scalar() or 0
        dests = (
            await db.execute(select(func.count(Destination.id)))
        ).scalar() or 0
        itins = (
            await db.execute(select(func.count(Itinerary.id)))
        ).scalar() or 0
        revs = (await db.execute(select(func.count(Review.id)))).scalar() or 0

        avg_budget = (await db.execute(
            select(func.avg(Itinerary.predicted_budget))
        )).scalar()

        popular = (await db.execute(
            select(Destination.name)
            .order_by(Destination.rating.desc())
            .limit(1)
        )).scalar()

        return {
            "total_users": users,
            "total_destinations": dests,
            "total_itineraries_generated": itins,
            "total_reviews": revs,
            "most_popular_destination": popular or "N/A",
            "average_trip_budget_npr": round(
                float(avg_budget), 0) if avg_budget else 0,
        }


# ── Health check ──

@app.get("/health")
async def health():
    return {"status": "ok", "service": "NepalGo API"}
