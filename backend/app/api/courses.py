"""Courses API endpoints."""

from uuid import UUID
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db, require_admin
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import Enrollment, LessonProgress
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseDetailResponse,
    CourseResponse,
    CourseUpdate,
)
from app.schemas.lesson import LessonResponse

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=list[CourseResponse])
async def read_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve courses with enrollment status and progress for current user."""
    result = await db.execute(select(Course).order_by(Course.created_at.desc()))
    courses = result.scalars().all()

    # Get enrollments for current user
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollments_map = {e.course_id: e for e in enrollment_result.scalars().all()}

    # Get active student counts for each course
    counts_result = await db.execute(
        select(Enrollment.course_id, func.count('*')).group_by(Enrollment.course_id)
    )
    students_map = {row[0]: row[1] for row in counts_result.all()}

    # Get lesson counts for each course
    lesson_counts_result = await db.execute(
        select(Lesson.course_id, func.count('*')).group_by(Lesson.course_id)
    )
    lessons_map = {row[0]: row[1] for row in lesson_counts_result.all()}

    # Get accumulated video duration from tracking (sum video_duration across all lessons for a given enrollment)
    duration_result = await db.execute(
        select(LessonProgress.course_id, func.sum(LessonProgress.video_duration))
        .where(LessonProgress.user_id == current_user.id)
        .group_by(LessonProgress.course_id)
    )
    duration_map = {row[0]: row[1] for row in duration_result.all()}

    response_courses = []
    for course in courses:
        # Strict Course Authorization: 
        # Students ONLY see courses they are explicitly enrolled in.
        # Admins see all courses.
        enrollment = enrollments_map.get(course.id)
        
        if current_user.role == "student" and not enrollment:
            continue

        r_course = CourseResponse.model_validate(course)
        r_course.total_lessons = lessons_map.get(course.id, 0)
        
        # Calculate dynamic duration if not hardcoded
        tracked_seconds = duration_map.get(course.id, 0) or 0
        if not r_course.duration and tracked_seconds > 0:
            minutes = tracked_seconds // 60
            r_course.duration = f"{minutes} min"
        
        if enrollment:
            r_course.enrollment_status = enrollment.status
            r_course.progress = enrollment.progress
        else:
            r_course.enrollment_status = "not-started"
            r_course.progress = 0
            
        r_course.students_enrolled = students_map.get(course.id, 0)
        response_courses.append(r_course)

    return response_courses


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def read_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get single course with lessons and progress breakdown."""
    # Eagerly load lessons
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.lessons))
        .where(Course.id == course_id)
    )
    course = result.scalar()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )
        
    # Python-side sort to guarantee order since selectinload doesn't respect outer query order_by perfectly
    sorted_lessons = sorted(course.lessons, key=lambda l: l.order_index)

    # Get user enrollment
    enrollment = await db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course_id,
            )
        )
    )

    # Get lesson progress mapper
    prog_result = await db.execute(
        select(LessonProgress).where(
            and_(
                LessonProgress.user_id == current_user.id,
                LessonProgress.lesson_id.in_([l.id for l in sorted_lessons])
            )
        )
    )
    progress_records = prog_result.scalars().all()
    progress_map = {p.lesson_id: p.completed for p in progress_records}
    
    total_tracked_seconds = sum(p.video_duration for p in progress_records if p.video_duration)

    r_course = CourseDetailResponse.model_validate(course)
    r_course.total_lessons = len(sorted_lessons)
    
    if not r_course.duration and total_tracked_seconds > 0:
        minutes = total_tracked_seconds // 60
        r_course.duration = f"{minutes} min"
    
    if enrollment:
        r_course.enrollment_status = enrollment.status
        r_course.progress = enrollment.progress
    else:
        r_course.enrollment_status = "not-started"
        r_course.progress = 0
        
    # Fetch active students count globally
    students_count = await db.scalar(
        select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
    )
    r_course.students_enrolled = students_count or 0

    # Build lessons list with dynamic lock logic
    r_lessons = []
    prev_completed = True # First lesson is never locked
    
    for lesson in sorted_lessons:
        completed = progress_map.get(lesson.id, False)
        
        dynamic_locked = False
        if current_user.role != "admin":
            if lesson.is_locked and lesson.order_index > 0 and not prev_completed:
                dynamic_locked = True
        else:
            dynamic_locked = False
            
        r_lesson = LessonResponse.model_validate(lesson)
        r_lesson.completed = completed
        r_lesson.is_locked = dynamic_locked
        r_lessons.append(r_lesson)
        
        prev_completed = completed
        
    r_course.lessons_list = r_lessons

    return r_course


@router.post("", response_model=CourseResponse)
async def create_course(
    course_in: CourseCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Create new course (Admin)."""
    course = Course(**course_in.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_in: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Update course (Admin)."""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )
        
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}")
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Delete course (Admin)."""
    course = await db.execute(
        select(Course)
        .options(selectinload(Course.lessons))
        .where(Course.id == course_id)
    )
    course = course.scalar()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )
    
    from app.core.supabase import delete_file
    
    # 1. Delete course thumbnail if it exists in Supabase
    if course.thumbnail_url:
        # Assuming thumbnail_url is a full path or just the filename
        # If it's a full URL, we extract the filename
        filename = course.thumbnail_url.split("/")[-1]
        await delete_file("images", filename)
    
    # 2. Delete all lesson videos
    for lesson in course.lessons:
        if lesson.video_url:
            await delete_file("videos", lesson.video_url)

    await db.delete(course)
    await db.commit()
    return {"message": "Course and all associated assets deleted"}
