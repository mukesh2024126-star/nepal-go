"""Chat router."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.chat_service import process_chat

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []


@router.post("")
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    return await process_chat(
        db=db,
        message=body.message,
        conversation_history=body.conversation_history,
    )
