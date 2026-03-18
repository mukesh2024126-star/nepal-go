import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    destination_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=True
    )
    destination_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    num_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    travel_month: Mapped[str | None] = mapped_column(String(20), nullable=True)
    budget_tier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    interests = mapped_column(Text, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    predicted_budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actual_schedule = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Upcoming")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
