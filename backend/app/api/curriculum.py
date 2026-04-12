"""Curriculum Items API Routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.curriculum import CurriculumItem
from app.models.lesson import Lesson
from app.models.progress import LessonProgress
from app.models.quiz import Quiz, QuizQuestion, QuizSubmission
from app.models.user import User
from app.schemas.curriculum import CurriculumItemCreate, CurriculumItemResponse, CurriculumItemUpdate

router = APIRouter()

@router.get("/api/courses/{course_id}/curriculum", response_model=list[CurriculumItemResponse])
async def get_curriculum(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all curriculum items for a course, dynamically locked based on previous completion."""
    stmt = (
        select(CurriculumItem)
        .where(CurriculumItem.course_id == course_id)
        .order_by(CurriculumItem.order_index)
        .options(selectinload(CurriculumItem.quiz).selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    result = await db.execute(stmt)
    items = list(result.scalars().all())

    if current_user.role == "admin":
        # Admins see everything unlocked
        for item in items:
            item.is_locked = False
        return items

    # For students, we must check progress locks
    all_unlocked = True
    response_items = []
    
    for item in items:
        computed_item = CurriculumItemResponse.model_validate(item)
        if item.is_locked:
            computed_item.is_locked = not all_unlocked
        else:
            computed_item.is_locked = False

        if item.type == "lesson" and item.lesson_id:
            # Check if this lesson is completed
            prog_stmt = select(LessonProgress).where(
                LessonProgress.user_id == current_user.id,
                LessonProgress.lesson_id == item.lesson_id,
            )
            prog_result = await db.execute(prog_stmt)
            progress = prog_result.scalar_one_or_none()
            
            if progress and progress.completed:
                computed_item.completed = True
            else:
                all_unlocked = False

        elif item.type == "quiz" and item.quiz_id:
            # Check for Quiz submission
            sub_stmt = select(QuizSubmission).where(
                QuizSubmission.user_id == current_user.id,
                QuizSubmission.quiz_id == item.quiz_id
            ).order_by(QuizSubmission.submitted_at.desc())
            sub_result = await db.execute(sub_stmt)
            submission = sub_result.scalars().first()
            
            if submission:
                computed_item.completed = True
                computed_item.quiz_score = submission.score
                computed_item.quiz_status = submission.status
            else:
                all_unlocked = False
        
        elif item.type == "slides":
            # Slide completion logic not fully implemented yet in previous turns, but let's assume it doesn't block
            pass

        response_items.append(computed_item)

    return response_items

@router.post("/api/admin/courses/{course_id}/curriculum", response_model=CurriculumItemResponse)
async def create_curriculum_item(
    course_id: UUID,
    item_in: CurriculumItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        
    db_item = CurriculumItem(course_id=course_id, **item_in.model_dump())
    db.add(db_item)
    await db.commit()

    # Reload with eager loading to avoid MissingGreenlet
    stmt = (
        select(CurriculumItem)
        .where(CurriculumItem.id == db_item.id)
        .options(selectinload(CurriculumItem.quiz).selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.put("/api/admin/curriculum/{item_id}", response_model=CurriculumItemResponse)
async def update_curriculum_item(
    item_id: UUID,
    item_update: CurriculumItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    stmt = select(CurriculumItem).where(CurriculumItem.id == item_id)
    result = await db.execute(stmt)
    db_item = result.scalar_one_or_none()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)

    await db.commit()

    # Reload with eager loading
    stmt2 = (
        select(CurriculumItem)
        .where(CurriculumItem.id == item_id)
        .options(selectinload(CurriculumItem.quiz).selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    result2 = await db.execute(stmt2)
    return result2.scalar_one()

@router.delete("/api/admin/curriculum/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_curriculum_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    stmt = select(CurriculumItem).where(CurriculumItem.id == item_id)
    result = await db.execute(stmt)
    db_item = result.scalar_one_or_none()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(db_item)
    await db.commit()
