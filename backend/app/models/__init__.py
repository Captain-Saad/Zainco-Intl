"""Export all models so SQLAlchemy registry finds them."""

from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import (
    Achievement,
    Activity,
    Enrollment,
    LessonProgress,
    VideoSession,
)
from app.models.quiz import (
    Quiz,
    QuizQuestion,
    QuizOption,
    QuizSubmission,
    QuizAnswer,
)
from app.models.curriculum import CurriculumItem

__all__ = [
    "User",
    "Course",
    "Lesson",
    "Achievement",
    "Activity",
    "Enrollment",
    "LessonProgress",
    "VideoSession",
    "Quiz",
    "QuizQuestion",
    "QuizOption",
    "QuizSubmission",
    "QuizAnswer",
    "CurriculumItem",
]
