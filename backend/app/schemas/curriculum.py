"""Pydantic schemas for Quizzes and Curriculum Items."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


# --- Quiz Options ---
class QuizOptionBase(BaseModel):
    option_text: str
    is_correct: bool = False

class QuizOptionCreate(QuizOptionBase):
    pass

class QuizOptionUpdate(BaseModel):
    option_text: str | None = None
    is_correct: bool | None = None

class QuizOptionResponse(BaseModel):
    id: UUID
    option_text: str
    # is_correct explicitly excluded from student views usually, but kept here for pure ORM mapping.
    # The API will construct student-safe schemas directly or strip this.
    model_config = ConfigDict(from_attributes=True)


# --- Quiz Questions ---
class QuizQuestionBase(BaseModel):
    question_type: str  # 'mcq' | 'short_answer'
    question_text: str
    order_index: int

class QuizQuestionCreate(QuizQuestionBase):
    options: list[QuizOptionCreate] = []

class QuizQuestionUpdate(BaseModel):
    question_type: str | None = None
    question_text: str | None = None
    order_index: int | None = None
    options: list[QuizOptionCreate] | None = None

class QuizQuestionResponse(QuizQuestionBase):
    id: UUID
    options: list[QuizOptionResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- Quiz Submissions ---
class QuizAnswerCreate(BaseModel):
    question_id: UUID
    answer_text: str | None = None
    selected_option: UUID | None = None

class QuizSubmissionCreate(BaseModel):
    answers: list[QuizAnswerCreate] = []

class QuizSubmissionUpdate(BaseModel):
    score: int | None = None
    status: str | None = None

class QuizAnswerResponse(BaseModel):
    id: UUID
    question_id: UUID
    answer_text: str | None = None
    selected_option: UUID | None = None
    model_config = ConfigDict(from_attributes=True)

class QuizSubmissionResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    user_id: UUID
    submitted_at: datetime
    score: int | None = None
    status: str
    answer_file_url: str | None = None
    answers: list[QuizAnswerResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- Quizzes ---
class QuizBase(BaseModel):
    title: str
    time_limit_mins: int | None = None
    quiz_mode: str  # 'upload' | 'builder'

class QuizCreate(QuizBase):
    course_id: UUID

class QuizUpdate(BaseModel):
    title: str | None = None
    time_limit_mins: int | None = None

class QuizResponse(QuizBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    quiz_file_url: str | None = None
    questions: list[QuizQuestionResponse] = []
    my_submission: QuizSubmissionResponse | None = None
    model_config = ConfigDict(from_attributes=True)


# --- Curriculum Items ---
class CurriculumItemBase(BaseModel):
    title: str
    type: str  # 'lesson' | 'slides' | 'quiz'
    order_index: int
    is_locked: bool = True

class CurriculumItemCreate(CurriculumItemBase):
    lesson_id: UUID | None = None
    quiz_id: UUID | None = None
    slides_url: str | None = None

class CurriculumItemUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    order_index: int | None = None
    is_locked: bool | None = None

class CurriculumItemResponse(CurriculumItemBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    lesson_id: UUID | None = None
    slides_url: str | None = None
    quiz_id: UUID | None = None
    
    # Optional nested data depending on the item type
    quiz: QuizResponse | None = None
    
    # Progress/Status context relative to active user
    completed: bool = False
    quiz_score: int | None = None
    quiz_status: str | None = None

    model_config = ConfigDict(from_attributes=True)
