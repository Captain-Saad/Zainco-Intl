"""Pydantic schemas for lessons."""

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class LessonBase(BaseModel):
    title: str
    description: str | None = None
    order_index: int
    duration: str | None = None


class LessonCreate(LessonBase):
    is_locked: bool = True


class LessonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order_index: int | None = None
    duration: str | None = None
    is_locked: bool | None = None


class LessonResponse(LessonBase):
    id: UUID
    course_id: UUID
    is_locked: bool
    is_uploading: bool = False
    completed: bool = False
    video_key: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
