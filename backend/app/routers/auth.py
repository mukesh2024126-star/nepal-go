"""Auth router."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register_user, login_user
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await register_user(
            db=db,
            full_name=body.full_name,
            username=body.username,
            email=body.email,
            password=body.password,
            travel_style=body.travel_style,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await login_user(db=db, email=body.email, password=body.password)
        return result
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Account has been deactivated")


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "travel_style": current_user.travel_style,
        "preferred_difficulty": current_user.preferred_difficulty,
        "preferred_budget_tier": current_user.preferred_budget_tier,
        "cluster_id": current_user.cluster_id,
        "cluster_label": current_user.cluster_label,
        "scores": {
            "adventure": round((current_user.adventure_score or 0) * 100),
            "cultural": round((current_user.cultural_score or 0) * 100),
            "nature": round((current_user.nature_score or 0) * 100),
            "luxury": round((current_user.luxury_score or 0) * 100),
        },
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
