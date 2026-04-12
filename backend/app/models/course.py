"""Course SQLAlchemy model."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Course(Base):
    """Courses table — MCC, JOC, Type, SIM."""

    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    instructor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_lessons: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    thumbnail_url: Mapped[str | None] = mapped_column(String, nullable=True)
    learning_outcomes: Mapped[list[str]] = mapped_column(JSONB, server_default='[]')
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    lessons = relationship(
        "Lesson", back_populates="course", lazy="selectin", order_by="Lesson.order_index"
    )
    enrollments = relationship("Enrollment", back_populates="course", lazy="selectin")
