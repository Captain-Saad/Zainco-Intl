"""EnrollmentInquiry model — stores enquiries submitted from the public Enroll page."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class EnrollmentInquiry(Base):
    __tablename__ = "enrollment_inquiries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    license_number = Column(String(100), nullable=False)
    message = Column(Text, nullable=True, default="")
    status = Column(String(20), nullable=False, default="new")  # new | reviewed | contacted
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
