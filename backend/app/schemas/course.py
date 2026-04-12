"""Pydantic schemas for courses."""

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.lesson import LessonResponse


class CourseBase(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    instructor: str | None = None
    duration: str | None = None
    thumbnail_url: str | None = None
    learning_outcomes: list[str] = Field(default_factory=list, max_length=20)


class CourseCreate(CourseBase):
    total_lessons: int = 0
    status: str = "draft"


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    instructor: str | None = None
    duration: str | None = None
    total_lessons: int | None = None
    status: str | None = None
    thumbnail_url: str | None = None
    learning_outcomes: list[str] | None = Field(default=None, max_length=20)


class CourseResponse(CourseBase):
    id: UUID
    total_lessons: int
    status: str
    created_at: datetime
    updated_at: datetime
    progress: int = 0
    enrollment_status: str = "not-started"
    students_enrolled: int = 0

    model_config = {"from_attributes": True}


class CourseDetailResponse(CourseResponse):
    lessons_list: list[LessonResponse] = []
