"""Enrollment inquiry endpoints — public submission + admin management."""

import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.models.enrollment_inquiry import EnrollmentInquiry
from app.models.user import User
from app.schemas.admin import (
    EnrollmentInquiryCreate,
    EnrollmentInquiryResponse,
    EnrollmentInquiryStatusUpdate,
    GenericMessageResponse,
)

# Public router (no auth required)
public_router = APIRouter(tags=["Enrollment Inquiries"])

# Admin router (auth required)
admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@public_router.post(
    "/enrollment-inquiries",
    response_model=EnrollmentInquiryResponse,
    status_code=201,
)
async def submit_enrollment_inquiry(
    req: EnrollmentInquiryCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Public endpoint — submit an enrollment inquiry from the Enroll page."""
    inquiry = EnrollmentInquiry(
        id=uuid.uuid4(),
        name=req.name,
        email=req.email,
        phone=req.phone,
        license_number=req.license_number,
        message=req.message or "",
        status="new",
    )
    db.add(inquiry)
    await db.commit()
    await db.refresh(inquiry)
    return inquiry


@admin_router.get(
    "/enrollment-inquiries",
    response_model=List[EnrollmentInquiryResponse],
)
async def list_enrollment_inquiries(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Admin-only — list all enrollment inquiries, newest first."""
    result = await db.execute(
        select(EnrollmentInquiry).order_by(EnrollmentInquiry.created_at.desc())
    )
    return result.scalars().all()


@admin_router.get("/enrollment-inquiries/count")
async def get_new_inquiry_count(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Admin-only — return count of inquiries with status 'new'."""
    count = await db.scalar(
        select(func.count(EnrollmentInquiry.id)).where(
            EnrollmentInquiry.status == "new"
        )
    )
    return {"count": count or 0}


@admin_router.patch(
    "/enrollment-inquiries/{inquiry_id}/status",
    response_model=GenericMessageResponse,
)
async def update_inquiry_status(
    inquiry_id: uuid.UUID,
    req: EnrollmentInquiryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Admin-only — update the status of an enrollment inquiry."""
    if req.status not in ("new", "reviewed", "contacted"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    inquiry = await db.get(EnrollmentInquiry, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry.status = req.status
    db.add(inquiry)
    await db.commit()
    return {"message": f"Inquiry status updated to '{req.status}'."}
