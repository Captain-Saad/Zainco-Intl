import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, require_admin
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import Enrollment, VideoSession
from app.models.user import User
from app.schemas.admin import (
    AdminStatsResponse,
    CreateStudentRequest,
    EnrollStudentRequest,
    GenericMessageResponse,
    StudentDetailResponse,
    StudentEnrollmentResponse,
    StudentListResponse,
)
from app.core.security import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])
videos_dir = Path("videos")
videos_dir.mkdir(exist_ok=True)
images_dir = Path("images")
images_dir.mkdir(exist_ok=True)


@router.post("/courses/image")
async def upload_course_image(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
) -> Any:
    """Upload a cover image for a course."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = images_dir / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/images/{filename}"}


@router.get("/stats", response_model=AdminStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Return high-level statistics for the admin dashboard."""
    # 1. Total Students (non-admin users)
    total_students = await db.scalar(
        select(func.count(User.id)).where(User.role != "admin")
    )

    # 2. Total Courses
    total_courses = await db.scalar(select(func.count(Course.id)))

    # 3. Total Lessons
    total_lessons = await db.scalar(select(func.count(Lesson.id)))

    # 4. Active Sessions (Valid Video Sessions right now)
    now = datetime.now(timezone.utc)
    active_sessions = await db.scalar(
        select(func.count(VideoSession.id)).where(VideoSession.expires_at > now)
    )

    return AdminStatsResponse(
        total_students=total_students or 0,
        total_courses=total_courses or 0,
        total_lessons=total_lessons or 0,
        active_sessions=active_sessions or 0,
    )


@router.get("/students", response_model=List[StudentListResponse])
async def list_students(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """List all non-admin students with overall progress."""
    students = await db.execute(
        select(User)
        .where(User.role != "admin")
        .order_by(User.created_at.desc())
    )
    student_list = students.scalars().all()
    
    result = []
    for s in student_list:
        enrollments = await db.execute(
            select(Enrollment).where(Enrollment.user_id == s.id)
        )
        enrolls = enrollments.scalars().all()
        
        overall_progress = 0
        if enrolls:
            total_prog = sum((e.progress or 0) for e in enrolls)
            overall_progress = int(total_prog / len(enrolls))
            
        student_data = StudentListResponse.model_validate(s).model_dump()
        student_data['overall_progress'] = overall_progress
        result.append(student_data)
        
    return result


@router.post("/students", response_model=StudentDetailResponse)
async def create_student(
    req: CreateStudentRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Create a new student and optionally enroll them in a course."""
    # Check if email exists
    existing_user = await db.scalar(select(User).where(User.email == req.email))
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    name = f"{req.first_name} {req.last_name}".strip()
    new_student = User(
        id=uuid.uuid4(),
        email=req.email,
        password=hash_password(req.password),
        name=name,
        role="student",
        license=req.license_number,
        phone=req.phone,
        is_active=True,
    )
    db.add(new_student)
    await db.flush()

    enrollments = []
    if req.course_id:
        course = await db.get(Course, req.course_id)
        if course:
            new_enroll = Enrollment(
                id=uuid.uuid4(),
                user_id=new_student.id,
                course_id=course.id,
                status="not-started",
                progress=0,
            )
            db.add(new_enroll)
            await db.flush()
            enrollments.append(
                StudentEnrollmentResponse(
                    course_id=course.id,
                    title=course.title,
                    status="not-started",
                    progress=0,
                )
            )

    await db.commit()

    return StudentDetailResponse(
        id=new_student.id,
        email=new_student.email,
        name=new_student.name,
        license=new_student.license,
        phone=new_student.phone,
        is_active=new_student.is_active,
        created_at=new_student.created_at,
        enrollments=enrollments
    )


@router.get("/students/{student_id}", response_model=StudentDetailResponse)
async def get_student_detail(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Get detailed profile and course enrollments for a specific student."""
    student = await db.get(User, student_id)
    if not student or student.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    enrollments_result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.course))
        .where(Enrollment.user_id == student_id)
    )
    
    enrollment_responses = []
    for enr in enrollments_result.scalars().all():
        if enr.course:
            enrollment_responses.append(
                StudentEnrollmentResponse(
                    course_id=enr.course.id,
                    title=enr.course.title,
                    status=enr.status,
                    progress=enr.progress or 0,
                )
            )

    return StudentDetailResponse(
        id=student.id,
        email=student.email,
        name=student.name,
        license=student.license,
        phone=student.phone,
        is_active=student.is_active,
        created_at=student.created_at,
        enrollments=enrollment_responses
    )


@router.post("/students/{student_id}/enroll", response_model=GenericMessageResponse)
async def manual_enrollment(
    student_id: uuid.UUID,
    enroll_req: EnrollStudentRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Manually enroll a student into a course."""
    student = await db.get(User, student_id)
    if not student or student.role == "admin":
        raise HTTPException(status_code=404, detail="Student not found")

    course = await db.get(Course, enroll_req.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = await db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == student_id,
                Enrollment.course_id == course.id,
            )
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled")

    new_enrollment = Enrollment(
        user_id=student.id,
        course_id=course.id,
        status="not-started",
        progress=0,
    )
    db.add(new_enrollment)
    await db.commit()

    return {"message": f"Successfully enrolled {student.email} in {course.title}"}


@router.delete("/students/{student_id}/enroll/{course_id}", response_model=GenericMessageResponse)
async def revoke_enrollment(
    student_id: uuid.UUID,
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Revoke a student's access to a course."""
    student = await db.get(User, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = await db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == student_id,
                Enrollment.course_id == course_id,
            )
        )
    )
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    await db.delete(enrollment)
    await db.commit()

    return {"message": "Access revoked successfully"}


@router.post("/lessons/{lesson_id}/video", response_model=GenericMessageResponse)
async def upload_video(
    lesson_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Upload a video file for a lesson (Admin only)."""
    if not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a video",
        )

    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Generate a unique filename to avoid overwrites
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = videos_dir / filename

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update lesson record
    lesson.video_url = filename
    db.add(lesson)
    await db.commit()

    return {"message": f"Video successfully uploaded and linked to '{lesson.title}'"}

from app.schemas.admin import AdminGraphsResponse, GraphDataResponse, DailyActivityResponse, PieDataResponse, UpdateStudentStatusRequest

@router.get("/graphs", response_model=AdminGraphsResponse)
async def get_dashboard_graphs(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Return data for Admin Dashboard charts."""
    # 1. Enrollments per Course
    courses_res = await db.execute(select(Course.id, Course.category, Course.title))
    enrollments_data = []
    
    for course_id, category, title in courses_res.all():
        count = await db.scalar(select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id))
        display_name = category if category else (title[:10] + '...' if len(title) > 10 else title)
        enrollments_data.append(GraphDataResponse(name=display_name, students=count or 0))

    if not enrollments_data:
        enrollments_data = [GraphDataResponse(name="No Courses", students=0)]

    # 2. Daily Active Students (Last 30 days)
    from datetime import timedelta
    from app.models.progress import Activity
    now_utc = datetime.now(timezone.utc)
    thirty_days_ago = now_utc - timedelta(days=29)
    
    activity_records = await db.execute(
        select(Activity.created_at, Activity.user_id)
        .where(Activity.created_at >= thirty_days_ago)
    )
    
    daily_bins = {}
    for i in range(30):
        d = (thirty_days_ago + timedelta(days=i)).strftime('%m-%d')
        daily_bins[d] = set()

    for created_at, u_id in activity_records.all():
        d_str = created_at.strftime('%m-%d')
        if d_str in daily_bins:
            daily_bins[d_str].add(u_id)

    activity_data = [
        DailyActivityResponse(day=d, active=len(users))
        for d, users in daily_bins.items()
    ]

    # 3. Completion Demographics
    total_enrolls = await db.scalar(select(func.count(Enrollment.id))) or 0
    if total_enrolls == 0:
        pie_data = [
            PieDataResponse(name='Completed', value=0, color='hsl(var(--primary))'),
            PieDataResponse(name='In Progress', value=0, color='hsl(var(--accent))'),
            PieDataResponse(name='Not Started', value=100, color='hsl(var(--card))'),
        ]
    else:
        completed = await db.scalar(select(func.count(Enrollment.id)).where(Enrollment.status == 'completed')) or 0
        in_progress = await db.scalar(select(func.count(Enrollment.id)).where(Enrollment.status == 'in-progress')) or 0
        not_started = await db.scalar(select(func.count(Enrollment.id)).where(Enrollment.status == 'not-started')) or 0
        
        pie_data = [
            PieDataResponse(name='Completed', value=int((completed/total_enrolls)*100), color='hsl(var(--primary))'),
            PieDataResponse(name='In Progress', value=int((in_progress/total_enrolls)*100), color='hsl(var(--accent))'),
            PieDataResponse(name='Not Started', value=int((not_started/total_enrolls)*100), color='hsl(var(--card))'),
        ]

    return AdminGraphsResponse(
        enrollments=enrollments_data,
        activity=activity_data,
        completion=pie_data
    )


@router.patch("/students/{student_id}/status", response_model=GenericMessageResponse)
async def update_student_status(
    student_id: uuid.UUID,
    req: UpdateStudentStatusRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Activate or deactivate a student."""
    student = await db.get(User, student_id)
    if not student or student.role == "admin":
        raise HTTPException(status_code=404, detail="Student not found")

    student.is_active = req.is_active
    db.add(student)
    await db.commit()
    
    state = "activated" if req.is_active else "deactivated"
    return {"message": f"Student {student.email} has been {state}."}


@router.delete("/students/{student_id}", response_model=GenericMessageResponse)
async def delete_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    """Delete a student and all their associated data."""
    student = await db.get(User, student_id)
    if not student or student.role == "admin":
        raise HTTPException(status_code=404, detail="Student not found")

    await db.delete(student)
    await db.commit()
    return {"message": f"Student {student.email} has been permanently deleted."}

