"""Pydantic schemas for progress and activities."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: UUID
    type: str
    description: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class AchievementResponse(BaseModel):
    badge_key: str
    earned_at: datetime


class WeeklyStat(BaseModel):
    day: str
    minutes: int


class CourseProgressResponse(BaseModel):
    course_id: UUID
    title: str
    progress: int
    lessons_done: int
    total_lessons: int


class ProgressSummaryResponse(BaseModel):
    overall_percent: int
    courses: List[CourseProgressResponse]
    weekly_stats: List[WeeklyStat]
    achievements: List[AchievementResponse]
    streak_days: int
