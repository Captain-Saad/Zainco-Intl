"""Seed the database with test users, courses, and lessons from mockData.ts."""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import async_session_factory, engine, Base
from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import Enrollment, LessonProgress

# ── Test Users ──────────────────────────────────────────────────────────────────

USERS = [
    {
        "email": "student@zainco.pk",
        "password": "pilot123",
        "name": "Ahmed Khan",
        "role": "student",
        "license": "CPL-PK-2847",
        "phone": "+92-321-4567890",
    },
    {
        "email": "admin@zainco.pk",
        "password": "admin123",
        "name": "Zain Ahmed",
        "role": "admin",
        "license": None,
        "phone": "+92-300-1234567",
    },
]

# ── Courses & Lessons (mirrors mockData.ts exactly) ─────────────────────────────

COURSES = [
    {
        "title": "Multi Crew Cooperation (MCC)",
        "description": "Master the fundamentals of multi-crew operations in a commercial airline environment. Develop CRM skills, crew coordination, threat and error management, and standard operating procedures.",
        "category": "MCC",
        "instructor": "Capt. Ali Hassan",
        "duration": "36 hrs",
        "total_lessons": 12,
        "status": "published",
        "lessons": [
            {"title": "Introduction to Multi-Crew Operations", "duration": "45 min", "order_index": 1, "is_locked": False, "completed": True},
            {"title": "Crew Resource Management Fundamentals", "duration": "60 min", "order_index": 2, "is_locked": False, "completed": True},
            {"title": "Standard Operating Procedures", "duration": "50 min", "order_index": 3, "is_locked": False, "completed": True},
            {"title": "Threat and Error Management", "duration": "55 min", "order_index": 4, "is_locked": False, "completed": True},
            {"title": "Communication & Briefing Techniques", "duration": "40 min", "order_index": 5, "is_locked": False, "completed": False},
            {"title": "Normal Procedures: Pre-flight", "duration": "45 min", "order_index": 6, "is_locked": False, "completed": False},
            {"title": "Normal Procedures: Takeoff & Climb", "duration": "50 min", "order_index": 7, "is_locked": True, "completed": False},
            {"title": "Normal Procedures: Cruise & Descent", "duration": "45 min", "order_index": 8, "is_locked": True, "completed": False},
            {"title": "Abnormal Procedures", "duration": "60 min", "order_index": 9, "is_locked": True, "completed": False},
            {"title": "Emergency Procedures", "duration": "65 min", "order_index": 10, "is_locked": True, "completed": False},
            {"title": "Line Oriented Flight Training (LOFT)", "duration": "90 min", "order_index": 11, "is_locked": True, "completed": False},
            {"title": "MCC Assessment & Debrief", "duration": "60 min", "order_index": 12, "is_locked": True, "completed": False},
        ],
    },
    {
        "title": "Jet Orientation Course (JOC)",
        "description": "Transition from piston/turboprop aircraft to high-performance jet operations. Covers high-altitude operations, jet aerodynamics, performance calculations, and A-320 family systems overview.",
        "category": "JOC",
        "instructor": "Capt. Usman Malik",
        "duration": "24 hrs",
        "total_lessons": 8,
        "status": "published",
        "lessons": [
            {"title": "Jet Aerodynamics & High-Speed Flight", "duration": "60 min", "order_index": 1, "is_locked": False, "completed": True},
            {"title": "High-Altitude Operations & Pressurization", "duration": "55 min", "order_index": 2, "is_locked": False, "completed": True},
            {"title": "Jet Performance & Weight & Balance", "duration": "50 min", "order_index": 3, "is_locked": False, "completed": False},
            {"title": "A-320 Family Overview & Systems", "duration": "75 min", "order_index": 4, "is_locked": False, "completed": False},
            {"title": "ECAM Systems & Warnings", "duration": "60 min", "order_index": 5, "is_locked": True, "completed": False},
            {"title": "Fuel Systems & Planning", "duration": "45 min", "order_index": 6, "is_locked": True, "completed": False},
            {"title": "FMS & Autopilot Operations", "duration": "80 min", "order_index": 7, "is_locked": True, "completed": False},
            {"title": "JOC Simulator Assessment", "duration": "120 min", "order_index": 8, "is_locked": True, "completed": False},
        ],
    },
    {
        "title": "A-320 Procedures & Systems",
        "description": "Comprehensive study of Airbus A-320 aircraft systems, limitations, normal and abnormal procedures. Prepares pilots for type rating training and airline operations.",
        "category": "Type",
        "instructor": "Capt. Zain Ahmed",
        "duration": "45 hrs",
        "total_lessons": 15,
        "status": "published",
        "lessons": [
            {"title": "A-320 Airframe & Powerplant", "duration": "60 min", "order_index": 1, "is_locked": False, "completed": False},
            {"title": "Flight Controls & EFCS", "duration": "75 min", "order_index": 2, "is_locked": True, "completed": False},
            {"title": "Hydraulic Systems", "duration": "50 min", "order_index": 3, "is_locked": True, "completed": False},
            {"title": "Electrical Systems", "duration": "55 min", "order_index": 4, "is_locked": True, "completed": False},
            {"title": "Pneumatic & Air Conditioning", "duration": "45 min", "order_index": 5, "is_locked": True, "completed": False},
            {"title": "Fuel System Operations", "duration": "50 min", "order_index": 6, "is_locked": True, "completed": False},
            {"title": "Navigation & Communication Systems", "duration": "65 min", "order_index": 7, "is_locked": True, "completed": False},
            {"title": "FMGC & Flight Planning", "duration": "80 min", "order_index": 8, "is_locked": True, "completed": False},
            {"title": "Normal Procedures Flows", "duration": "90 min", "order_index": 9, "is_locked": True, "completed": False},
            {"title": "Abnormal & Emergency Procedures", "duration": "90 min", "order_index": 10, "is_locked": True, "completed": False},
            {"title": "Aircraft Limitations", "duration": "45 min", "order_index": 11, "is_locked": True, "completed": False},
            {"title": "Weight & Performance", "duration": "60 min", "order_index": 12, "is_locked": True, "completed": False},
            {"title": "Meteorology for Jet Operations", "duration": "55 min", "order_index": 13, "is_locked": True, "completed": False},
            {"title": "RVSM & Special Operations", "duration": "45 min", "order_index": 14, "is_locked": True, "completed": False},
            {"title": "A-320 Written Examination", "duration": "120 min", "order_index": 15, "is_locked": True, "completed": False},
        ],
    },
    {
        "title": "Simulator Briefings & Debriefs",
        "description": "Pre and post simulator session briefings covering standard scenarios, performance analysis, and pilot monitoring responsibilities. Essential preparation for full flight simulator sessions.",
        "category": "SIM",
        "instructor": "Capt. Ali Hassan",
        "duration": "12 hrs",
        "total_lessons": 6,
        "status": "published",
        "lessons": [
            {"title": "Simulator Orientation & Controls", "duration": "30 min", "order_index": 1, "is_locked": False, "completed": True},
            {"title": "Normal Procedures Simulator Briefing", "duration": "45 min", "order_index": 2, "is_locked": False, "completed": True},
            {"title": "Abnormal Procedures Briefing", "duration": "60 min", "order_index": 3, "is_locked": False, "completed": True},
            {"title": "Engine Failure Procedures", "duration": "55 min", "order_index": 4, "is_locked": False, "completed": True},
            {"title": "Rejected Takeoff & Emergency Landing", "duration": "60 min", "order_index": 5, "is_locked": False, "completed": True},
            {"title": "Final Debrief & Assessment Review", "duration": "45 min", "order_index": 6, "is_locked": False, "completed": True},
        ],
    },
]


async def seed():
    """Seed the database with test data."""
    async with async_session_factory() as session:
        print("Clearing existing data...")
        await session.execute(LessonProgress.__table__.delete())
        await session.execute(Enrollment.__table__.delete())
        await session.execute(Lesson.__table__.delete())
        await session.execute(Course.__table__.delete())
        await session.execute(User.__table__.delete())
        await session.commit()

        print("Seeding database...")

        # ── Create Users ────────────────────────────────────────────────────
        db_users = []
        for user_data in USERS:
            user = User(
                id=uuid.uuid4(),
                email=user_data["email"],
                password=hash_password(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                license=user_data.get("license"),
                phone=user_data.get("phone"),
                is_active=True,
            )
            session.add(user)
            db_users.append(user)

        await session.flush()
        student_user = db_users[0]  # student@zainco.pk
        print(f"  Created {len(db_users)} users")

        # ── Create Courses & Lessons ────────────────────────────────────────
        for course_data in COURSES:
            course = Course(
                id=uuid.uuid4(),
                title=course_data["title"],
                description=course_data["description"],
                category=course_data["category"],
                instructor=course_data["instructor"],
                duration=course_data["duration"],
                total_lessons=course_data["total_lessons"],
                status=course_data["status"],
            )
            session.add(course)
            await session.flush()

            # Calculate overall progress for the mock data
            completed_count = sum(1 for l in course_data["lessons"] if l["completed"])
            progress_pct = int((completed_count / course_data["total_lessons"]) * 100) if course_data["total_lessons"] > 0 else 0
            
            c_status = "not-started"
            if progress_pct > 0 and progress_pct < 100:
                c_status = "in-progress"
            elif progress_pct == 100:
                c_status = "completed"

            # Enroll the student in this course
            enrollment = Enrollment(
                id=uuid.uuid4(),
                user_id=student_user.id,
                course_id=course.id,
                progress=progress_pct,
                status=c_status,
            )
            session.add(enrollment)

            # Create lessons and progress
            for lesson_data in course_data["lessons"]:
                lesson = Lesson(
                    id=uuid.uuid4(),
                    course_id=course.id,
                    title=lesson_data["title"],
                    duration=lesson_data["duration"],
                    order_index=lesson_data["order_index"],
                    is_locked=lesson_data["is_locked"],
                )
                session.add(lesson)
                await session.flush()

                # Create progress for completed lessons (student only)
                if lesson_data["completed"]:
                    progress = LessonProgress(
                        id=uuid.uuid4(),
                        user_id=student_user.id,
                        lesson_id=lesson.id,
                        course_id=course.id,
                        watch_percent=100,
                        completed=True,
                        last_position=0,
                        completed_at=datetime.now(timezone.utc),
                    )
                    session.add(progress)

            print(f"  Created course: {course_data['title']} ({len(course_data['lessons'])} lessons)")

        await session.commit()
        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
