"""Quizzes API Routes."""

import os
import shutil
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db
from app.models.curriculum import CurriculumItem
from app.models.quiz import (
    Quiz,
    QuizAnswer,
    QuizOption,
    QuizQuestion,
    QuizSubmission,
)
from app.models.user import User
from app.core.supabase import upload_file, get_public_url
from app.schemas.curriculum import (
    QuizCreate,
    QuizQuestionCreate,
    QuizQuestionResponse,
    QuizQuestionUpdate,
    QuizResponse,
    QuizSubmissionCreate,
    QuizSubmissionResponse,
    QuizUpdate,
)

router = APIRouter()

# Directories for uploads
QUIZ_FILES_DIR = "quiz-files"
os.makedirs(QUIZ_FILES_DIR, exist_ok=True)


@router.post("/api/admin/quizzes", response_model=QuizResponse)
async def create_quiz(
    quiz_in: QuizCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    db_quiz = Quiz(**quiz_in.model_dump())
    db.add(db_quiz)
    await db.commit()

    # Reload with eager loading to avoid MissingGreenlet on serialization
    stmt = (
        select(Quiz)
        .where(Quiz.id == db_quiz.id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.post("/api/admin/quizzes/{quiz_id}/upload-document", response_model=QuizResponse)
async def upload_quiz_document(
    quiz_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        
    stmt = select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    result = await db.execute(stmt)
    db_quiz = result.scalar_one_or_none()
    
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    filename = f"{quiz_id.hex}.{ext}"

    content = await file.read()
    # Upload to Supabase 'quizzes' bucket
    await upload_file("quizzes", filename, content, file.content_type)
        
    db_quiz.quiz_mode = "upload"
    db_quiz.quiz_file_url = get_public_url("quizzes", filename)
    await db.commit()
    
    # Reload
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/api/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
    )
    result = await db.execute(stmt)
    db_quiz = result.scalar_one_or_none()

    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    response_quiz = QuizResponse.model_validate(db_quiz)

    # If student, populate my_submission and strip correct answers
    if current_user.role != "admin":
        sub_stmt = select(QuizSubmission).where(
            QuizSubmission.quiz_id == quiz_id,
            QuizSubmission.user_id == current_user.id
        ).options(selectinload(QuizSubmission.answers)).order_by(QuizSubmission.submitted_at.desc())
        sub_result = await db.execute(sub_stmt)
        response_quiz.my_submission = sub_result.scalars().first()

    return response_quiz


@router.post("/api/admin/quizzes/{quiz_id}/questions", response_model=QuizQuestionResponse)
async def add_quiz_question(
    quiz_id: UUID,
    question_in: QuizQuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        
    question_data = question_in.model_dump(exclude={"options"})
    db_question = QuizQuestion(quiz_id=quiz_id, **question_data)
    db.add(db_question)
    await db.flush()  # To get db_question.id
    
    for opt_in in question_in.options:
        db_opt = QuizOption(question_id=db_question.id, **opt_in.model_dump())
        db.add(db_opt)
        
    await db.commit()
    
    # Reload to get options populated fully
    stmt = select(QuizQuestion).where(QuizQuestion.id == db_question.id).options(selectinload(QuizQuestion.options))
    result = await db.execute(stmt)
    return result.scalar_one()

@router.delete("/api/admin/quizzes/{quiz_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_question(
    quiz_id: UUID,
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    stmt = select(QuizQuestion).where(QuizQuestion.id == question_id, QuizQuestion.quiz_id == quiz_id)
    result = await db.execute(stmt)
    db_question = result.scalar_one_or_none()
    
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    await db.delete(db_question)
    await db.commit()


@router.post("/api/quizzes/{quiz_id}/submit", response_model=QuizSubmissionResponse)
async def submit_quiz(
    quiz_id: UUID,
    submission_in: QuizSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if a submission already exists for this user and quiz
    check_stmt = select(QuizSubmission).where(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.user_id == current_user.id
    )
    check_result = await db.execute(check_stmt)
    if check_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already submitted this quiz.")

    # Verify Quiz exists and get Questions to calculate score
    stmt = select(Quiz).where(Quiz.id == quiz_id).options(
       selectinload(Quiz.questions).selectinload(QuizQuestion.options)
    )
    result = await db.execute(stmt)
    db_quiz = result.scalar_one_or_none()
    if not db_quiz:
         raise HTTPException(status_code=404, detail="Quiz not found")

    # Create submission record
    db_submission = QuizSubmission(
        quiz_id=quiz_id,
        user_id=current_user.id,
        status="submitted"
    )
    db.add(db_submission)
    await db.flush()

    total_score = 0
    requires_manual_grading = False

    # Process Answers
    for ans_in in submission_in.answers:
        db_answer = QuizAnswer(
            submission_id=db_submission.id,
            question_id=ans_in.question_id,
            answer_text=ans_in.answer_text,
            selected_option=ans_in.selected_option
        )
        db.add(db_answer)

        # Attempt Auto Grade MCQ
        target_question = next((q for q in db_quiz.questions if q.id == ans_in.question_id), None)
        if target_question:
            if target_question.question_type == 'mcq':
                correct_option = next((o for o in target_question.options if o.is_correct), None)
                if correct_option and correct_option.id == ans_in.selected_option:
                    total_score += 1
            else:
                requires_manual_grading = True

    if not requires_manual_grading and db_quiz.quiz_mode == 'builder':
        db_submission.status = "graded"
        db_submission.score = total_score
        
    await db.commit()
    
    # Reload with answers for response
    stmt = select(QuizSubmission).where(QuizSubmission.id == db_submission.id).options(selectinload(QuizSubmission.answers))
    result = await db.execute(stmt)
    return result.scalar_one()

@router.post("/api/quizzes/{quiz_id}/submit-document", response_model=QuizSubmissionResponse)
async def submit_quiz_document(
    quiz_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if submission already exists
    check_stmt = select(QuizSubmission).where(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.user_id == current_user.id
    )
    if (await db.execute(check_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already submitted this quiz.")

    stmt = select(Quiz).where(Quiz.id == quiz_id)
    if not (await db.execute(stmt)).scalar_one_or_none():
         raise HTTPException(status_code=404, detail="Quiz not found")

    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    filename = f"submissions/sub_{quiz_id.hex}_{current_user.id.hex}.{ext}"

    content = await file.read()
    upload_file("quizzes", filename, content, file.content_type)

    db_submission = QuizSubmission(
        quiz_id=quiz_id,
        user_id=current_user.id,
        status="submitted",
        answer_file_url=get_public_url("quizzes", filename)
    )
    db.add(db_submission)
    await db.commit()
    
    stmt = select(QuizSubmission).where(QuizSubmission.id == db_submission.id).options(selectinload(QuizSubmission.answers))
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/api/admin/quizzes/{quiz_id}/submissions", response_model=list[QuizSubmissionResponse])
async def get_quiz_submissions(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        
    stmt = select(QuizSubmission).where(QuizSubmission.quiz_id == quiz_id).options(selectinload(QuizSubmission.answers)).order_by(QuizSubmission.submitted_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.get("/api/admin/submissions/{submission_id}", response_model=QuizSubmissionResponse)
async def get_submission_detail(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        
    stmt = select(QuizSubmission).where(QuizSubmission.id == submission_id).options(selectinload(QuizSubmission.answers))
    result = await db.execute(stmt)
    db_submission = result.scalar_one_or_none()
    
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    return db_submission

from app.schemas.curriculum import QuizSubmissionUpdate

@router.put("/api/admin/submissions/{submission_id}/grade", response_model=QuizSubmissionResponse)
async def grade_submission(
    submission_id: UUID,
    grade_in: QuizSubmissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        
    stmt = select(QuizSubmission).where(QuizSubmission.id == submission_id).options(selectinload(QuizSubmission.answers))
    result = await db.execute(stmt)
    db_submission = result.scalar_one_or_none()
    
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if grade_in.score is not None:
        db_submission.score = grade_in.score
    if grade_in.status is not None:
        db_submission.status = grade_in.status
        
    await db.commit()
    await db.refresh(db_submission)
    return db_submission
