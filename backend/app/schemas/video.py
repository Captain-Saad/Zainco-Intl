"""Pydantic schemas for video operations."""

from uuid import UUID
from pydantic import BaseModel


class VideoTokenRequest(BaseModel):
    lesson_id: UUID


class VideoTokenResponse(BaseModel):
    signed_url: str
    expires_in: int
    watermark_text: str


class VideoProgressRequest(BaseModel):
    lesson_id: UUID
    watch_percent: int
    current_position: int
    completed: bool
    watched_seconds: int = 0
    video_duration: int = 0


class VideoProgressResponse(BaseModel):
    updated: bool
