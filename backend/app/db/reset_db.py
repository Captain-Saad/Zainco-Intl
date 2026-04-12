"""Wipe all existing database data but keep a single admin account."""

import asyncio
import uuid

from app.core.security import hash_password
from app.db.database import async_session_factory
from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import Enrollment, LessonProgress, Activity, VideoSession


async def reset_db():
    async with async_session_factory() as session:
        print("Wiping all existing data...")
        await session.execute(Activity.__table__.delete())
        await session.execute(LessonProgress.__table__.delete())
        await session.execute(VideoSession.__table__.delete())
        await session.execute(Enrollment.__table__.delete())
        await session.execute(Lesson.__table__.delete())
        await session.execute(Course.__table__.delete())
        await session.execute(User.__table__.delete())
        await session.commit()
        print("Data wiped successfully.")

        print("Recreating admin account...")
        admin = User(
            id=uuid.uuid4(),
            email="admin@zainco.pk",
            password=hash_password("admin123"),
            name="Zain Admin",
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("Admin account created (admin@zainco.pk/admin123).")


if __name__ == "__main__":
    asyncio.run(reset_db())
