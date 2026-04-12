"""Lessons API endpoints."""

from uuid import UUID
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import LessonProgress
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonResponse, LessonUpdate

router = APIRouter(prefix="/courses/{course_id}/lessons", tags=["Lessons"])


@router.get("", response_model=list[LessonResponse])
async def read_lessons(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve lessons for a course with user completion status."""
    # Check if course exists
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Get all lessons for course ordered by index
    result = await db.execute(
        select(Lesson)
        .where(Lesson.course_id == course_id)
        .order_by(Lesson.order_index)
    )
    lessons = result.scalars().all()

    # Get user progress for these lessons
    prog_result = await db.execute(
        select(LessonProgress).where(
            and_(
                LessonProgress.user_id == current_user.id,
                LessonProgress.lesson_id.in_([l.id for l in lessons])
            )
        )
    )
    progress_map = {p.lesson_id: p.completed for p in prog_result.scalars().all()}

    # Attach completion status
    response_lessons = []
    prev_completed = True  # First lesson is never locked by completion
    for lesson in lessons:
        completed = progress_map.get(lesson.id, False)
        
        # Override is_locked dynamically based on previous lesson completion,
        # unless it is explicitly locked by the DB
        dynamic_locked = lesson.is_locked
        if current_user.role != "admin" and lesson.order_index > 0 and not prev_completed:
            dynamic_locked = True
        elif current_user.role == "admin":
            dynamic_locked = False
            
        r_lesson = LessonResponse.model_validate(lesson)
        r_lesson.completed = completed
        r_lesson.is_locked = dynamic_locked
        response_lessons.append(r_lesson)
        
        prev_completed = completed

    return response_lessons


@router.get("/{lesson_id}", response_model=LessonResponse)
async def read_lesson(
    course_id: UUID,
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific lesson by ID."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    progress = await db.scalar(
        select(LessonProgress).where(
            and_(
                LessonProgress.user_id == current_user.id,
                LessonProgress.lesson_id == lesson_id,
            )
        )
    )

    r_lesson = LessonResponse.model_validate(lesson)
    r_lesson.completed = progress.completed if progress else False
    return r_lesson


@router.post("", response_model=LessonResponse)
async def create_lesson(
    course_id: UUID,
    lesson_in: LessonCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Create new lesson (Admin)."""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )
        
    lesson = Lesson(**lesson_in.model_dump(), course_id=course_id)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    course_id: UUID,
    lesson_id: UUID,
    lesson_in: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Update lesson (Admin)."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    update_data = lesson_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}")
async def delete_lesson(
    course_id: UUID,
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Delete lesson (Admin)."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    await db.delete(lesson)
    await db.commit()
    return {"message": "Deleted"}
