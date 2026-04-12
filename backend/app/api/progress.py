import datetime
from typing import Any, List

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, and_, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import Achievement, Activity, Enrollment, LessonProgress
from app.models.user import User
from app.schemas.progress import (
    AchievementResponse,
    ActivityResponse,
    CourseProgressResponse,
    ProgressSummaryResponse,
    WeeklyStat,
)

router = APIRouter(prefix="/progress", tags=["Progress & Activities"])
activities_router = APIRouter(prefix="/activities", tags=["Progress & Activities"])


@router.get("", response_model=ProgressSummaryResponse)
async def get_progress_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get the full progress breakdown for the dashboard."""

    # 1. Overall & Course Progress
    enrollments_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollments = enrollments_result.scalars().all()

    course_progress_list = []
    total_progress = 0

    for enrollment in enrollments:
        if enrollment.progress is not None:
            total_progress += enrollment.progress

        # Count total lessons from course
        total_lessons_query = await db.scalar(
            select(func.count(Lesson.id)).where(Lesson.course_id == enrollment.course_id)
        )
        
        # Count completed lessons
        completed_lessons_query = await db.scalar(
            select(func.count(LessonProgress.id)).where(
                and_(
                    LessonProgress.course_id == enrollment.course_id,
                    LessonProgress.user_id == current_user.id,
                    LessonProgress.completed == True,
                )
            )
        )

        course = await db.get(Course, enrollment.course_id)
        
        if course:
            course_progress_list.append(
                CourseProgressResponse(
                    course_id=course.id,
                    title=course.title,
                    progress=enrollment.progress or 0,
                    lessons_done=completed_lessons_query or 0,
                    total_lessons=total_lessons_query or 0,
                )
            )

    overall_percent = (
        int(total_progress / len(enrollments)) if len(enrollments) > 0 else 0
    )


    # 2. Weekly Stats (Minutes watched per day over last 7 days)
    # This requires looking at updated_at on lesson progress, or estimating from duration...
    # For now, we'll mock this generation locally, or infer from lesson_progress.watched_at if we logged actual watch time duration.
    # We will build a basic generator to fulfill the schema shape since detailed watch times minutes are not easily derived without a session duration log.
    
    today = datetime.datetime.now(datetime.timezone.utc).date()
    days = [(today - datetime.timedelta(days=i)) for i in range(6, -1, -1)]
    
    weekly_stats = []
    
    # Simple algorithm: Group LessonProgress by watched_at date
    raw_stats = await db.execute(
        select(
            cast(LessonProgress.watched_at, Date).label("day"),
            func.count(LessonProgress.id).label("count")
        )
        .where(
            and_(
                LessonProgress.user_id == current_user.id,
                LessonProgress.watched_at >= days[0]
            )
        )
        .group_by(cast(LessonProgress.watched_at, Date))
    )
    
    stat_dict = {row.day: row.count for row in raw_stats.all()}
    
    for d in days:
        day_str = d.strftime("%A")[:3] # 'Mon', 'Tue'
        sessions = stat_dict.get(d, 0)
        # Mock assumption: each session = 25 minutes of focus time
        weekly_stats.append(WeeklyStat(day=day_str, minutes=sessions * 25))

    # 3. Achievements
    achievements_result = await db.execute(
        select(Achievement).where(Achievement.user_id == current_user.id)
    )
    achievements = achievements_result.scalars().all()
    achievements_list = [
        AchievementResponse(badge_key=a.badge_key, earned_at=a.earned_at)
        for a in achievements
    ]

    # 4. Streak Days Calculation
    # Simple continuous streak of watched_at dates ending today or yesterday
    all_dates = await db.execute(
        select(cast(LessonProgress.watched_at, Date))
        .where(LessonProgress.user_id == current_user.id)
        .distinct()
        .order_by(cast(LessonProgress.watched_at, Date).desc())
    )
    distinct_dates = [d[0] for d in all_dates.all() if d[0]]
    
    streak = 0
    check_date = today
    
    for d in distinct_dates:
        if d == check_date:
            streak += 1
            check_date -= datetime.timedelta(days=1)
        elif streak == 0 and d == today - datetime.timedelta(days=1):
            # Allow streak to continue if they haven't activity *yet* today but did yesterday
            streak = 1
            check_date = today - datetime.timedelta(days=2)
        else:
            break

    return ProgressSummaryResponse(
        overall_percent=overall_percent,
        courses=course_progress_list,
        weekly_stats=weekly_stats,
        achievements=achievements_list,
        streak_days=streak
    )


@activities_router.get("", response_model=List[ActivityResponse])
async def get_recent_activities(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get the user's recent activity stream."""
    activities = await db.execute(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
    )
    
    return [
        ActivityResponse(
            id=a.id,
            type=a.type,
            description=a.description,
            metadata=a.metadata_json,
            created_at=a.created_at
        )
        for a in activities.scalars().all()
    ]
