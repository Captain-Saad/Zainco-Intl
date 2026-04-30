import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_current_user, get_db
from app.core.supabase import get_signed_url
from app.models.lesson import Lesson
from app.models.progress import Activity, Enrollment, LessonProgress, VideoSession
from app.models.user import User
from app.schemas.video import (
    VideoProgressRequest,
    VideoProgressResponse,
    VideoTokenRequest,
    VideoTokenResponse,
)

router = APIRouter(prefix="/video", tags=["Video Streaming"])
settings = get_settings()

CHUNK_SIZE = 1024 * 1024  # 1MB


@router.post("/token", response_model=VideoTokenResponse)
async def create_video_token(
    request: Request,
    token_request: VideoTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Generate a short-lived signed URL token for streaming a video."""
    lesson = await db.get(Lesson, token_request.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Check enrollment
    enrollment = await db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == lesson.course_id,
            )
        )
    )
    if current_user.role != "admin" and not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(hours=2)
    session_token = str(uuid.uuid4())
    
    v_session = VideoSession(
        user_id=current_user.id,
        lesson_id=lesson.id,
        session_token=session_token,
        expires_at=expires_at,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(v_session)
    await db.commit()

    # The streaming URL (matches proxy rules or local IP)
    
    signed_url = f"{str(request.base_url).rstrip('/')}/api/video/stream/{session_token}"
    # Replace absolute URL with relative if preferred, but frontend might expect absolute
    # To be safe for frontend API wrapper, returning relative:
    signed_url = f"/api/video/stream/{session_token}"

    return VideoTokenResponse(
        signed_url=signed_url,
        expires_in=7200,
        watermark_text=current_user.email,
    )





@router.get("/stream/{token}")
async def stream_video(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Redirect to a secure Supabase signed URL for streaming."""
    # Find active session
    v_session = await db.scalar(
        select(VideoSession).where(
            and_(
                VideoSession.session_token == token,
                VideoSession.expires_at > datetime.now(timezone.utc),
            )
        )
    )
    
    if not v_session:
        raise HTTPException(status_code=401, detail="Token invalid or expired")

    # Fetch the lesson to get the actual video path
    lesson = await db.get(Lesson, v_session.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if not lesson.video_url:
        # Fallback to sample if missing
        filename = "sample.mp4"
    else:
        filename = lesson.video_url
        # If it's a full URL, extract just the filename from the end
        if "supabase.co" in filename:
            filename = filename.split("/")[-1]
            
        # Clean up other path prefixes if any
        for prefix in ["/videos/", "videos/", "/"]:
            if filename.startswith(prefix):
                filename = filename.replace(prefix, "", 1)

    try:
        # Generate a signed URL that expires in 2 hours
        signed_url = await get_signed_url("videos", filename, expires_in=7200)
    except Exception as e:
        print(f"ERROR: get_signed_url exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Streaming service error: {str(e)}")
        
    if not signed_url:
        print(f"ERROR: No signed URL generated for {filename}")
        raise HTTPException(status_code=404, detail=f"Video file '{filename}' not found in storage. Please re-upload.")
        
    return RedirectResponse(url=signed_url)


@router.post("/progress", response_model=VideoProgressResponse)
async def update_video_progress(
    progress_req: VideoProgressRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update watch percentage and handle completion / unlocking."""
    lesson = await db.get(Lesson, progress_req.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = await db.scalar(
        select(LessonProgress).where(
            and_(
                LessonProgress.user_id == current_user.id,
                LessonProgress.lesson_id == lesson.id,
            )
        )
    )

    if not progress:
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson.id,
            course_id=lesson.course_id,
        )
        db.add(progress)

    # Update stats
    current_wp = progress.watch_percent or 0
    if progress_req.watch_percent > current_wp:
        progress.watch_percent = progress_req.watch_percent
        
    progress.last_position = progress_req.current_position or 0
    progress.watched_at = datetime.now(timezone.utc)

    # Accumulate actual tracked watch time from the player
    if progress_req.watched_seconds > (progress.watched_seconds or 0):
        progress.watched_seconds = progress_req.watched_seconds
    if progress_req.video_duration > 0:
        progress.video_duration = progress_req.video_duration

    # Completion gate: only allow completion based on actual watched time
    # The player sends accumulated watch seconds (capped deltas, no seek inflation)
    # Require watched_seconds >= 90% of video_duration
    newly_completed = False
    vid_dur = progress.video_duration or 0
    watched = progress.watched_seconds or 0
    real_pct = int((watched / vid_dur) * 100) if vid_dur > 0 else 0

    if not progress.completed and vid_dur > 0 and real_pct >= 90:
        progress.completed = True
        progress.completed_at = datetime.now(timezone.utc)
        progress.watch_percent = 100  # Snap to 100
        newly_completed = True

    await db.commit()

    await db.commit()

    # Re-calculate course enrollment progress (always, to reflect partial progress)
    enrollment = await db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == lesson.course_id,
            )
        )
    )
    if enrollment:
        all_lessons = await db.execute(
            select(Lesson).where(Lesson.course_id == lesson.course_id)
        )
        total_lessons = len(all_lessons.scalars().all())
        
        all_progresses = await db.execute(
            select(LessonProgress).where(
                and_(
                    LessonProgress.user_id == current_user.id,
                    LessonProgress.course_id == lesson.course_id,
                )
            )
        )
        
        # Calculate continuous progress (average watch percent across all lessons)
        total_watch_percent = sum(p.watch_percent for p in all_progresses.scalars().all() if p.watch_percent)
        prog_pct = int(total_watch_percent / total_lessons) if total_lessons > 0 else 0
        
        # Snap to 100 if completed
        if prog_pct > 100:
            prog_pct = 100
            
        enrollment.progress = prog_pct
        
        if prog_pct == 100:
            enrollment.status = "completed"
            if not enrollment.completed_at:
                enrollment.completed_at = datetime.now(timezone.utc)
        elif prog_pct > 0:
            enrollment.status = "in-progress"

    await db.commit()

    if newly_completed:
        # Log activity only for newly completing a full lesson
        activity = Activity(
            user_id=current_user.id,
            type="video_watched",
            description=f"Completed lesson: {lesson.title}",
            metadata_json={"lesson_id": str(lesson.id), "course_id": str(lesson.course_id)}
        )
        db.add(activity)
        await db.commit()

    return VideoProgressResponse(updated=True)
