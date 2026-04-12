"""Pydantic schemas for the Admin Dashboard."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AdminStatsResponse(BaseModel):
    total_students: int
    total_courses: int
    total_lessons: int
    active_sessions: int


class StudentEnrollmentResponse(BaseModel):
    course_id: UUID
    title: str
    status: str
    progress: int


class CreateStudentRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    license_number: Optional[str] = None
    phone: Optional[str] = None
    course_id: Optional[UUID] = None


class StudentListResponse(BaseModel):
    id: UUID
    email: str
    name: str
    license: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    overall_progress: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class StudentDetailResponse(StudentListResponse):
    enrollments: List[StudentEnrollmentResponse]


class EnrollStudentRequest(BaseModel):
    course_id: UUID


class GenericMessageResponse(BaseModel):
    message: str


class GraphDataResponse(BaseModel):
    name: str
    students: int

class DailyActivityResponse(BaseModel):
    day: str
    active: int

class PieDataResponse(BaseModel):
    name: str
    value: int
    color: str

class AdminGraphsResponse(BaseModel):
    enrollments: List[GraphDataResponse]
    activity: List[DailyActivityResponse]
    completion: List[PieDataResponse]

class UpdateStudentStatusRequest(BaseModel):
    is_active: bool
