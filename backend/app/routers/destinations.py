"""Destinations router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.services.destination_service import (
    list_destinations,
    get_featured,
    get_destination_by_slug,
)

router = APIRouter()


@router.get("")
async def get_destinations(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    season: Optional[int] = Query(None),
    budget_max: Optional[int] = Query(None),
    sort: str = Query("popular"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    return await list_destinations(
        db=db,
        search=search,
        category=category,
        region=region,
        difficulty=difficulty,
        season=season,
        budget_max=budget_max,
        sort=sort,
        page=page,
        limit=limit,
    )


@router.get("/featured")
async def featured(db: AsyncSession = Depends(get_db)):
    return await get_featured(db)


@router.get("/{slug}")
async def destination_detail(slug: str, db: AsyncSession = Depends(get_db)):
    result = await get_destination_by_slug(db, slug)
    if not result:
        raise HTTPException(status_code=404, detail="Destination not found")
    return result
