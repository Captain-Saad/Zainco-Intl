"""AeroLearn FastAPI application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.curriculum import router as curriculum_router
from app.api.lessons import router as lessons_router
from app.api.progress import router as progress_router, activities_router
from app.api.quizzes import router as quizzes_router
from app.api.video import router as video_router
from app.core.config import get_settings
import app.models  # load all models for SQLAlchemy registry

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    yield


app = FastAPI(
    title="AeroLearn LMS API",
    description="Aviation training platform for Zainco International",
    version="1.0.0",
    lifespan=lifespan,

)

from fastapi.staticfiles import StaticFiles

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
app.mount("/images", StaticFiles(directory="images"), name="images")

import os
os.makedirs("quiz-files", exist_ok=True)
app.mount("/quiz-files", StaticFiles(directory="quiz-files"), name="quiz-files")

# Include routers under /api prefix
app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(curriculum_router) # Not using prefix, already specified inside router
app.include_router(lessons_router, prefix="/api")
app.include_router(progress_router, prefix="/api")
app.include_router(activities_router, prefix="/api")
app.include_router(quizzes_router) # Not using prefix, already specified inside router
app.include_router(video_router, prefix="/api")


@app.get("/api/healthz")
async def healthz():
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "db": "connected",
    }
