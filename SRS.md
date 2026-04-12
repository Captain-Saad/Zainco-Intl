# AeroLearn LMS — Software Requirements Specification (SRS)
**Project:** Zainco International — Aviation Training LMS  
**Developer:** Saad (Solo, Full-Stack)  
**Frontend:** React + Vite + Tailwind + Framer Motion (already built, Replit)  
**Backend:** FastAPI + PostgreSQL (local dev → Railway/Supabase production)  
**AI Coding Tool:** Antigravity  
**Version:** 1.0.0  
**Date:** March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Frontend Audit](#2-current-frontend-audit)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [API Specification](#5-api-specification)
6. [Backend Requirements](#6-backend-requirements)
7. [Frontend–Backend Integration Map](#7-frontendbackend-integration-map)
8. [Video Protection & Streaming](#8-video-protection--streaming)
9. [Authentication & Authorization Flow](#9-authentication--authorization-flow)
10. [Antigravity Setup & Rules](#10-antigravity-setup--rules)
11. [Development Workflow](#11-development-workflow)
12. [Local Development Setup](#12-local-development-setup)
13. [Production Deployment Plan](#13-production-deployment-plan)
14. [Initial Kickoff Prompt for Antigravity](#14-initial-kickoff-prompt-for-antigravity)

---

## 1. Project Overview

### What We Are Building

AeroLearn is a premium, protected Learning Management System (LMS) for Zainco International — a Pakistani aviation training organization offering MCC, JOC, and A-320 type training to Commercial Pilot License (CPL) holders.

### Business Context

- **Target Users:** CPL holders in Pakistan seeking A-320 airline careers
- **Batch Size:** 10 students per cohort (5 pairs for MCC)
- **Content:** 4 courses, 41 total lessons, 50+ simulator hours
- **Contact:** zainco747@gmail.com

### Goals

1. Replace all mock data in the existing frontend with real database-backed API calls
2. Build a secure FastAPI backend that serves the frontend
3. Protect video content from downloading and screen recording
4. Track student activity comprehensively
5. Give admin full visibility and control

### Constraints

- **Solo developer:** Saad builds everything alone
- **Zero cost in dev:** Local PostgreSQL, local FastAPI, no paid services until production
- **Frontend is locked in design:** The Replit-generated React frontend is the source of truth for UI. Backend must conform to what the frontend expects
- **Antigravity is the AI coding assistant** for all backend code

---

## 2. Current Frontend Audit

### Stack

| Item | Technology |
|---|---|
| Framework | React 18 + Vite |
| Router | Wouter v3 |
| State Management | React Context (AuthContext) + TanStack Query |
| UI Components | Radix UI + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | @workspace/api-client-react (custom fetch wrapper) |
| Styling | Tailwind CSS v4 |

### Pages Inventory

| Route | Page | Auth Required | Role |
|---|---|---|---|
| `/` | Landing | No | Public |
| `/login` | Login | No | Public |
| `/enroll` | Enrollment Form | No | Public |
| `/dashboard` | Student Dashboard | Yes | Student |
| `/courses` | My Courses | Yes | Student |
| `/courses/:id` | Course Detail | Yes | Student |
| `/courses/:id/lesson/:lessonId` | Lesson + Video | Yes | Student |
| `/progress` | Progress Tracker | Yes | Student |
| `/profile` | Student Profile | Yes | Student |
| `/admin` | Admin Overview | Yes | Admin |
| `/admin/students` | Manage Students | Yes | Admin |
| `/admin/courses` | Manage Courses | Yes | Admin |

### Current Auth Implementation

- Auth state stored in `localStorage` under key `zainco_user`
- AuthContext provides `user`, `login()`, `logout()`
- User object shape: `{ email, role, name, license, phone? }`
- Mock credentials hardcoded in `Login.tsx`:
  - `student@zainco.pk / pilot123`
  - `admin@zainco.pk / admin123`
- **ACTION REQUIRED:** Replace mock login with real API call to `POST /api/auth/login`

### Current Mock Data Location

`artifacts/aerolearn/src/data/mockData.ts` — contains:
- `courses[]` — 4 courses with `lessons_list[]`
- `students[]` — 8 mock students
- `activities[]` — 10 activity items
- `weeklyStats[]` — 7 days of study data
- `achievements[]` — badge system

**ACTION REQUIRED:** All these will be replaced by API responses. The interfaces defined in mockData.ts must match the API response shapes exactly.

### API Client

The frontend uses `@workspace/api-client-react` which wraps fetch with a base URL.  
The base URL defaults to `/api` (from `openapi.yaml` servers config).  
In development, Vite will proxy `/api` → `http://localhost:8000`.

---

## 3. System Architecture

### Development Architecture (Local)

```
Browser (localhost:5173)
        ↓  HTTP requests to /api/*
Vite Dev Server (proxy /api → :8000)
        ↓
FastAPI Backend (localhost:8000)
        ↓
PostgreSQL (localhost:5432)
        +
Local file storage for videos (dev only)
```

### Production Architecture

```
Browser
    ↓
Vercel (Next.js / React Static)
    ↓ HTTPS API calls
Railway (FastAPI)
    ↓
Supabase PostgreSQL (managed)
    +
Cloudflare Stream (video CDN + HLS encryption)
Cloudflare R2 (video file storage)
```

### Monorepo Structure (Existing + New)

```
Aero-cockpit/
├── artifacts/
│   ├── aerolearn/              ← EXISTING React frontend
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── data/mockData.ts  ← will be phased out
│   │       └── ...
│   └── api-server/             ← EXISTING shell (Node/Express)
├── backend/                    ← NEW — FastAPI backend (Saad creates this)
│   ├── main.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── courses.py
│   │   │   ├── lessons.py
│   │   │   ├── progress.py
│   │   │   ├── students.py
│   │   │   ├── admin.py
│   │   │   └── video.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── lesson.py
│   │   │   └── progress.py
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── seed.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── deps.py
│   │   └── middleware/
│   │       ├── cors.py
│   │       └── auth.py
│   ├── alembic/                ← DB migrations
│   ├── requirements.txt
│   └── .env
├── lib/
│   ├── api-spec/openapi.yaml   ← EXTEND this with all new endpoints
│   └── db/src/schema/          ← EXTEND with Drizzle schemas
└── .antigravity/
    └── rules.md                ← Antigravity instructions (see Section 10)
```

---

## 4. Database Schema

### PostgreSQL Tables

#### `users`

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- bcrypt hashed
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(20) DEFAULT 'student', -- 'student' | 'admin'
  license     VARCHAR(100),                  -- CPL-PK-XXXX
  phone       VARCHAR(30),
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

#### `courses`

```sql
CREATE TABLE courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  category     VARCHAR(50),                  -- 'MCC' | 'JOC' | 'Type' | 'Sim'
  instructor   VARCHAR(255),
  duration     VARCHAR(50),                  -- '36 hrs'
  total_lessons INT DEFAULT 0,
  status       VARCHAR(20) DEFAULT 'draft',  -- 'draft' | 'published'
  thumbnail_url TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

#### `lessons`

```sql
CREATE TABLE lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES courses(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  order_index   INT NOT NULL,               -- lesson sequence
  duration      VARCHAR(20),               -- '45 min'
  video_url     TEXT,                      -- local path in dev, Cloudflare URL in prod
  video_key     VARCHAR(500),              -- Cloudflare Stream video ID (prod)
  is_locked     BOOLEAN DEFAULT true,      -- unlocked when prev lesson complete
  created_at    TIMESTAMP DEFAULT NOW()
);
```

#### `enrollments`

```sql
CREATE TABLE enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  course_id   UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);
```

#### `lesson_progress`

```sql
CREATE TABLE lesson_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  lesson_id       UUID REFERENCES lessons(id),
  course_id       UUID REFERENCES courses(id),
  watch_percent   INT DEFAULT 0,            -- 0–100
  completed       BOOLEAN DEFAULT false,
  last_position   INT DEFAULT 0,            -- seconds, for resume
  watched_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);
```

#### `activities`

```sql
CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(50),                  -- 'video' | 'quiz' | 'login' | 'achievement'
  description TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `achievements`

```sql
CREATE TABLE achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  badge_key   VARCHAR(100),                 -- 'first_login' | '50_percent' | etc
  earned_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);
```

#### `video_sessions`

```sql
CREATE TABLE video_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  lesson_id       UUID REFERENCES lessons(id),
  session_token   VARCHAR(500),             -- short-lived signed token
  issued_at       TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP,
  ip_address      VARCHAR(50),
  user_agent      TEXT
);
```

---

## 5. API Specification

All endpoints are prefixed with `/api`. Base URL in dev: `http://localhost:8000/api`

### Authentication

#### `POST /api/auth/login`
**Body:** `{ email: string, password: string }`  
**Response:** `{ access_token, token_type, user: { id, email, name, role, license, phone } }`  
**Notes:** Returns JWT. Frontend stores in localStorage as `zainco_token`.

#### `POST /api/auth/logout`
**Auth:** Required  
**Response:** `{ message: "Logged out" }`

#### `GET /api/auth/me`
**Auth:** Required  
**Response:** `{ id, email, name, role, license, phone, avatar_url }`  
**Notes:** Called on app boot to restore auth state from token.

#### `POST /api/auth/register` *(Admin only)*
**Body:** `{ email, password, name, license, phone, role }`  
**Response:** Created user object

---

### Courses

#### `GET /api/courses`
**Auth:** Required  
**Response:** Array of courses with enrollment status and progress for current user

```json
[
  {
    "id": "uuid",
    "title": "Multi Crew Cooperation (MCC)",
    "description": "...",
    "category": "MCC",
    "instructor": "Capt. Ali Hassan",
    "duration": "36 hrs",
    "total_lessons": 12,
    "status": "published",
    "thumbnail_url": null,
    "progress": 65,
    "enrollment_status": "in-progress",
    "students_enrolled": 47
  }
]
```

#### `GET /api/courses/:id`
**Auth:** Required  
**Response:** Single course object with `lessons_list[]` including lock status and completion for current user

#### `POST /api/courses` *(Admin only)*
**Body:** `{ title, description, category, instructor, duration }`  
**Response:** Created course

#### `PUT /api/courses/:id` *(Admin only)*
**Body:** Partial course fields  
**Response:** Updated course

#### `DELETE /api/courses/:id` *(Admin only)*
**Response:** `{ message: "Deleted" }`

---

### Lessons

#### `GET /api/courses/:courseId/lessons`
**Auth:** Required  
**Response:** Ordered list of lessons with completion status for current user

#### `GET /api/courses/:courseId/lessons/:lessonId`
**Auth:** Required  
**Response:** Single lesson detail. Does NOT include video URL directly — video requires a separate signed token request.

#### `POST /api/courses/:courseId/lessons` *(Admin only)*
**Body:** `{ title, description, order_index, duration }`

#### `PUT /api/courses/:courseId/lessons/:lessonId` *(Admin only)*

#### `DELETE /api/courses/:courseId/lessons/:lessonId` *(Admin only)*

---

### Video

#### `POST /api/video/token`
**Auth:** Required  
**Body:** `{ lesson_id: string }`  
**Response:** `{ signed_url: string, expires_in: 7200, watermark_text: string }`  
**Notes:**  
- Verifies user is enrolled in the course containing this lesson
- Verifies previous lesson is completed (if lesson is locked)
- Returns a short-lived signed URL (2 hours expiry in dev, 2 hours in prod)
- `watermark_text` = student email for overlay in the player
- Logs session in `video_sessions` table

#### `POST /api/video/progress`
**Auth:** Required  
**Body:** `{ lesson_id, watch_percent, current_position, completed }`  
**Response:** `{ updated: true }`  
**Notes:** Called every 30 seconds by the video player. Marks lesson complete when `watch_percent >= 90`. Auto-unlocks next lesson when completed.

#### `POST /api/admin/video/upload` *(Admin only)*
**Body:** multipart/form-data with `file`, `lesson_id`  
**Notes:** In dev: saves to `backend/videos/` folder. In prod: uploads to Cloudflare R2 then Cloudflare Stream.

---

### Progress

#### `GET /api/progress`
**Auth:** Required  
**Response:**

```json
{
  "overall_percent": 47,
  "courses": [
    { "course_id": "uuid", "title": "MCC", "progress": 65, "lessons_done": 8, "total_lessons": 12 }
  ],
  "weekly_stats": [
    { "day": "Mon", "minutes": 45 },
    { "day": "Tue", "minutes": 0 },
    ...
  ],
  "achievements": [
    { "badge_key": "first_login", "earned_at": "2026-01-01T10:00:00Z" }
  ],
  "streak_days": 5
}
```

#### `GET /api/activities`
**Auth:** Required  
**Query params:** `?limit=10`  
**Response:** Array of recent activity items with timestamps

---

### Students (Admin)

#### `GET /api/admin/students`
**Auth:** Admin  
**Response:** Array of all students with enrollment counts and last activity

#### `GET /api/admin/students/:id`
**Auth:** Admin  
**Response:** Student detail with full progress breakdown

#### `PUT /api/admin/students/:id`
**Auth:** Admin  
**Body:** `{ is_active, name, email, phone, license }`

#### `DELETE /api/admin/students/:id`
**Auth:** Admin

#### `POST /api/admin/students/enroll`
**Auth:** Admin  
**Body:** `{ user_id, course_id }`

---

### Admin Analytics

#### `GET /api/admin/stats`
**Auth:** Admin  
**Response:**

```json
{
  "total_students": 8,
  "active_this_week": 5,
  "completions": 3,
  "enrollments_by_course": [...],
  "daily_active": [...]
}
```

---

### Profile

#### `PUT /api/profile`
**Auth:** Required  
**Body:** `{ name, phone, license }`  
**Response:** Updated user object

#### `PUT /api/profile/password`
**Auth:** Required  
**Body:** `{ current_password, new_password }`

---

### Health

#### `GET /api/healthz`
**Response:** `{ status: "ok", timestamp: "...", db: "connected" }`

---

## 6. Backend Requirements

### Technology Stack

| Component | Technology |
|---|---|
| Language | Python 3.11+ |
| Framework | FastAPI 0.110+ |
| ORM | SQLAlchemy 2.0 (async) |
| Database Driver | asyncpg |
| Migrations | Alembic |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Validation | Pydantic v2 |
| Video (dev) | Local file serve with streaming |
| Video (prod) | Cloudflare Stream signed URLs |
| CORS | FastAPI CORSMiddleware |
| Config | pydantic-settings + .env |

### `requirements.txt`

```
fastapi==0.110.0
uvicorn[standard]==0.27.1
sqlalchemy[asyncio]==2.0.28
asyncpg==0.29.0
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic==2.6.3
pydantic-settings==2.2.1
python-multipart==0.0.9
httpx==0.26.0
aiofiles==23.2.1
python-dotenv==1.0.1
```

### `backend/.env` (Development)

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/aerolearn
SECRET_KEY=dev-secret-key-change-in-production-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VIDEO_STORAGE_PATH=./videos
ENVIRONMENT=development
```

### Security Rules

1. All routes except `/api/auth/login`, `/api/auth/register`, `/api/healthz` require JWT Bearer token
2. Admin routes check `user.role == 'admin'` — return 403 if not
3. Students can only access their own data (enforced via `current_user.id` in queries)
4. Video tokens are single-use per session and expire after 2 hours
5. Passwords hashed with bcrypt, minimum cost factor 12
6. JWT tokens expire after 24 hours (configurable via env)

### CORS Configuration

```python
origins = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
    "https://your-production-domain.vercel.app"  # prod (add later)
]
```

---

## 7. Frontend–Backend Integration Map

This section maps every frontend file that uses mock data to the API endpoint it must call.

### `useAuth.tsx`

| Current | Replace With |
|---|---|
| `localStorage.getItem('zainco_user')` | Call `GET /api/auth/me` with stored JWT token on app boot |
| Hardcoded login in `Login.tsx` | Call `POST /api/auth/login` → store JWT in `localStorage` as `zainco_token` |
| `logout()` clears localStorage | Also call `POST /api/auth/logout` |

**New user object shape from API must match:**
```ts
interface User {
  id: string;      // ADD THIS — needed for API calls
  email: string;
  role: 'student' | 'admin';
  name: string;
  license: string;
  phone?: string;
}
```

### `Dashboard.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| `courses` (filtered for in-progress) | `GET /api/courses` → filter `enrollment_status === 'in-progress'` |
| `activities` | `GET /api/activities?limit=5` |
| `weeklyStats` | `GET /api/progress` → use `weekly_stats` field |
| StatCard values (hardcoded) | `GET /api/progress` → derive from response |

### `Courses.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| `courses[]` | `GET /api/courses` |

### `CourseDetail.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| Single course by id | `GET /api/courses/:id` |
| Lessons list | Included in course detail response as `lessons_list` |

### `Lesson.tsx` (Video Page)

| Mock Data Used | Replace With API Call |
|---|---|
| Video source URL | `POST /api/video/token` → use `signed_url` |
| Student watermark | Use `watermark_text` from token response (= user email) |
| Progress save | `POST /api/video/progress` every 30 seconds |
| Lesson list sidebar | `GET /api/courses/:id` → `lessons_list` |

### `Progress.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| All progress data | `GET /api/progress` |

### `Profile.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| User data | From `AuthContext` (populated via `GET /api/auth/me`) |
| Save profile | `PUT /api/profile` |
| Change password | `PUT /api/profile/password` |

### `AdminDashboard.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| Stats cards | `GET /api/admin/stats` |
| Charts data | Included in admin stats response |

### `AdminStudents.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| Students table | `GET /api/admin/students` |
| Edit student | `PUT /api/admin/students/:id` |
| Remove student | `DELETE /api/admin/students/:id` |

### `AdminCourses.tsx`

| Mock Data Used | Replace With API Call |
|---|---|
| Courses list | `GET /api/courses` |
| Create course | `POST /api/courses` |
| Edit course | `PUT /api/courses/:id` |
| Delete course | `DELETE /api/courses/:id` |

---

## 8. Video Protection & Streaming

### Development (Local)

In dev, videos are stored in `backend/videos/` and served via FastAPI with:
- **No direct URL exposure** — video path is never sent to frontend
- Frontend receives a **signed token** from `POST /api/video/token`
- FastAPI uses that token to stream the file in chunks
- No `Content-Disposition: attachment` header (prevents easy download)
- `X-Content-Type-Options: nosniff` header set

```python
# backend/app/api/video.py
@router.get("/stream/{token}")
async def stream_video(token: str, current_user: User = Depends(get_current_user)):
    # Validate token, find lesson, stream file with byte-range support
    ...
```

### Production (Cloudflare Stream)

1. Admin uploads video via `/api/admin/video/upload`
2. Backend uploads to Cloudflare R2 → triggers Cloudflare Stream processing
3. `video_key` stored in `lessons` table (Cloudflare Stream video ID)
4. When student requests video, backend generates a **signed URL** with 2-hour expiry
5. Signed URL is returned to frontend, video plays via HLS in custom player
6. Cloudflare prevents direct download — no MP4 download link served

### Watermarking

The video player in `Lesson.tsx` overlays the student's email via CSS:
```tsx
// Already in the frontend — just needs real email from API
<div className="watermark" style={{ opacity: 0.15 }}>
  {user.email}
</div>
```
This is a **software watermark** — deters casual recording. For maximum deterrence, this is the most practical solution without full DRM.

### Player Hardening (Frontend)

These are already implemented in the frontend shell. Confirm they are active:
- `onContextMenu={(e) => e.preventDefault()}` on video container
- No download attribute on any video element
- Custom controls — no native browser video controls that expose download
- `disablePictureInPicture` attribute on video element
- Video element `controlsList="nodownload noremoteplayback"`

---

## 9. Authentication & Authorization Flow

### Login Flow

```
1. User enters email + password on /login
2. Frontend calls POST /api/auth/login
3. Backend validates credentials (bcrypt compare)
4. Backend returns JWT access_token + user object
5. Frontend stores token in localStorage as 'zainco_token'
6. Frontend stores user object in AuthContext state
7. React Router redirects:
   - role === 'admin' → /admin
   - role === 'student' → /dashboard
```

### App Boot / Session Restore

```
1. App loads
2. AuthProvider checks localStorage for 'zainco_token'
3. If token exists → call GET /api/auth/me with Authorization: Bearer {token}
4. If /auth/me returns 200 → restore user in AuthContext
5. If /auth/me returns 401 → clear token, redirect to /login
6. If no token → user is null, public routes only
```

### API Request Headers

Every authenticated request must include:
```
Authorization: Bearer {token}
Content-Type: application/json
```

This is handled in `lib/api-client-react/src/custom-fetch.ts`:
```ts
// Saad: update custom-fetch.ts to read token from localStorage
const token = localStorage.getItem('zainco_token');
headers['Authorization'] = `Bearer ${token}`;
```

### Route Protection

Already implemented in `App.tsx` via `<ProtectedRoute>`. No changes needed there.

---

## 10. Antigravity Setup & Rules

### What is Antigravity?

Antigravity is Saad's AI coding assistant (similar to Cursor/Windsurf). It reads `.antigravity/rules.md` to understand project context before assisting with any task.

### File to Create

Create this file at the **root of the project**:

**`.antigravity/rules.md`**

```markdown
# AeroLearn LMS — Antigravity Rules

## Project Identity
- Name: AeroLearn by Zainco International
- Developer: Saad (solo)
- Purpose: Aviation training LMS for CPL holders in Pakistan
- Frontend: Already built — React + Vite + Wouter + TailwindCSS + Framer Motion (in artifacts/aerolearn/)
- Backend: FastAPI + PostgreSQL (you are building this in backend/)
- AI Tool: You are Antigravity — assist Saad with all backend tasks

## Golden Rules

1. NEVER modify anything inside artifacts/aerolearn/src/ unless Saad explicitly says "update frontend"
2. ALWAYS write async Python. Use `async def` for all route handlers and DB operations
3. ALWAYS use SQLAlchemy async session. Never use sync sessions.
4. ALWAYS validate with Pydantic v2 models. Every request body and response must have a schema.
5. NEVER hardcode credentials. All secrets come from .env via pydantic-settings Config class.
6. ALWAYS handle errors with proper HTTP status codes:
   - 400 for bad input
   - 401 for unauthenticated
   - 403 for unauthorized (wrong role)
   - 404 for not found
   - 500 for server errors with logged tracebacks
7. ALWAYS check if user is enrolled before serving any course/lesson content
8. ALWAYS check previous lesson completion before allowing access to locked lessons
9. Video URLs are NEVER returned directly — always via signed token endpoint
10. When in doubt about frontend data shapes, read artifacts/aerolearn/src/data/mockData.ts as the source of truth for response structure

## Stack Reference

- FastAPI version: 0.110.0
- SQLAlchemy: 2.0 (async)
- Database: PostgreSQL via asyncpg
- Auth: JWT with python-jose, passwords with passlib bcrypt
- Pydantic: v2 (use model_validator, not validator)
- Python: 3.11+

## Project File Structure (Backend)

backend/
├── main.py                     ← FastAPI app entry point
├── app/
│   ├── api/                    ← Route handlers (one file per domain)
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── lessons.py
│   │   ├── progress.py
│   │   ├── video.py
│   │   ├── admin.py
│   │   └── profile.py
│   ├── models/                 ← SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   └── activity.py
│   ├── schemas/                ← Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   └── user.py
│   ├── db/
│   │   ├── database.py         ← Async engine + session factory
│   │   └── seed.py             ← Seed script with test users + courses
│   └── core/
│       ├── config.py           ← pydantic-settings Config
│       ├── security.py         ← JWT create/verify + password hash
│       └── deps.py             ← FastAPI dependencies (get_db, get_current_user)
├── alembic/                    ← Migrations
├── videos/                     ← Local video storage (dev only, gitignored)
├── requirements.txt
└── .env

## API Prefix
All routes use prefix /api
Example: POST /api/auth/login, GET /api/courses

## CORS
Allow origins: http://localhost:5173 and http://localhost:3000
Allow all methods, all headers, credentials=True

## User Roles
- 'student': can read their own data, enroll, watch videos, track progress
- 'admin': can do everything + manage students, courses, upload videos

## Auth Pattern
Use FastAPI Depends system:
- get_db() → async db session
- get_current_user(token) → User or raise 401
- require_admin(user) → User if admin or raise 403

## Database Transactions
Always use `async with db.begin()` for write operations
Always commit at the end of successful writes
Always rollback on exceptions

## Naming Conventions
- Files: snake_case (auth.py, course_detail.py)
- Classes: PascalCase (UserCreate, CourseResponse)
- Variables/functions: snake_case
- Database tables: plural snake_case (users, lesson_progress)
- API routes: kebab-case (/api/admin/video-upload)

## Response Format
Success: return Pydantic schema directly (FastAPI serializes)
Error: raise HTTPException(status_code=XXX, detail="message")
List endpoints: return List[Schema]
Single item: return Schema

## Seeded Test Accounts (from seed.py)
student: student@zainco.pk / pilot123
admin:   admin@zainco.pk / admin123

## When Saad Says "connect to frontend"
It means: update artifacts/aerolearn/src to replace mock data imports with
real API calls using @tanstack/react-query useQuery/useMutation hooks,
pointing to the backend endpoints defined in this SRS.

## Video Rules
- In dev: serve from backend/videos/ folder using byte-range streaming
- Never expose file paths or direct file URLs
- Always generate a signed session token first
- Watermark text = authenticated user's email
- Token expires in 7200 seconds (2 hours)
```

---

## 11. Development Workflow

### Phase 1: Backend Foundation (Week 1)

**Goal:** Running FastAPI server connected to PostgreSQL with auth working

Tasks:
1. Create `backend/` folder structure
2. Write `requirements.txt` and install deps
3. Write `app/core/config.py` (pydantic-settings)
4. Write `app/db/database.py` (async SQLAlchemy engine)
5. Write all SQLAlchemy models in `app/models/`
6. Run Alembic migrations to create all tables
7. Write `app/core/security.py` (JWT + bcrypt)
8. Write `app/core/deps.py` (get_db, get_current_user, require_admin)
9. Write `app/api/auth.py` (login, logout, me endpoints)
10. Write `app/db/seed.py` and seed the database
11. Test auth with curl / Postman
12. Add Vite proxy config to forward `/api` to FastAPI

**Done when:** You can login with `student@zainco.pk / pilot123` and get a JWT back

---

### Phase 2: Core Courses & Lessons API (Week 1–2)

Tasks:
1. Write `app/schemas/` Pydantic models matching frontend interface shapes
2. Write `app/api/courses.py` — all course CRUD
3. Write `app/api/lessons.py` — lesson list and detail
4. Seed database with all 4 courses and 41 lessons (from mockData.ts)
5. Test all endpoints return data in correct shape

**Done when:** `GET /api/courses` returns the 4 courses with correct progress for test student

---

### Phase 3: Video System (Week 2)

Tasks:
1. Write `app/api/video.py` — token endpoint + stream endpoint
2. Implement byte-range video streaming from local `backend/videos/`
3. Implement `POST /api/video/progress` — save watch % every 30 seconds
4. Implement auto-unlock of next lesson when current lesson hits 90% watched
5. Add video session logging

**Done when:** A video file in `backend/videos/` plays in the frontend player with student email watermark

---

### Phase 4: Progress & Activities (Week 2–3)

Tasks:
1. Write `app/api/progress.py` — full progress summary
2. Write activity logging (auto-log on: login, lesson complete, achievement earned)
3. Implement streak calculation
4. Implement achievement unlock logic

**Done when:** Progress page shows real data from database

---

### Phase 5: Admin APIs (Week 3)

Tasks:
1. Write `app/api/admin.py` — student management, stats, analytics
2. Implement admin video upload (save to `backend/videos/`, store path in lesson)
3. Write course + lesson CRUD admin endpoints

**Done when:** Admin can create a course, add lessons, upload a video, enroll a student

---

### Phase 6: Frontend Integration (Week 3–4)

**This is the most delicate phase. Antigravity must NOT break existing frontend UI.**

Tasks (one page at a time):
1. Update `custom-fetch.ts` to include JWT header
2. Update `useAuth.tsx` to call real API
3. Replace `mockData.ts` imports in Dashboard → use `useQuery` hooks
4. Replace Courses page mock data
5. Replace CourseDetail page
6. Update Lesson page to call video token endpoint
7. Update Progress page
8. Update Admin pages
9. Update Profile page

**Rule:** Never delete `mockData.ts` until ALL pages are verified working with real API. Keep it as fallback.

---

### Phase 7: Testing & Polish (Week 4)

Tasks:
1. Test full student flow: login → enroll → watch video → progress tracked
2. Test admin flow: login → create course → add lesson → upload video → enroll student
3. Test video protection: verify no direct video URL accessible
4. Test route protection: verify student cannot access admin routes
5. Fix any CORS issues
6. Fix any data shape mismatches between API and frontend

---

## 12. Local Development Setup

### Prerequisites

```bash
# Required software
- Node.js 20+
- pnpm (for frontend)
- Python 3.11+
- PostgreSQL 15+ (local)
- Git
```

### Step 1: Clone and Install Frontend

```bash
cd Aero-cockpit
pnpm install
```

### Step 2: Setup PostgreSQL

```bash
# Create database
psql -U postgres
CREATE DATABASE aerolearn;
\q
```

### Step 3: Setup Backend

```bash
mkdir backend && cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from Section 6 above)
cp .env.example .env
# Edit .env with your postgres password
```

### Step 4: Run Migrations

```bash
cd backend
alembic upgrade head
python -m app.db.seed  # Seeds test users and courses
```

### Step 5: Add Vite Proxy

In `artifacts/aerolearn/vite.config.ts`, add proxy config:

```ts
server: {
  port,
  host: "0.0.0.0",
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

### Step 6: Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd Aero-cockpit
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/aerolearn dev
```

### Step 7: Verify

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs (FastAPI auto-generated Swagger)
- Health check: http://localhost:8000/api/healthz

---

## 13. Production Deployment Plan

*(Execute after local dev is complete and stable)*

### Services

| Service | Purpose | Cost |
|---|---|---|
| Vercel | Frontend (React static) | Free/Pro $20 |
| Railway | FastAPI backend | ~$15/month |
| Supabase Pro | PostgreSQL managed | $25/month |
| Cloudflare Stream | Video CDN + HLS | ~$20/month |
| Cloudflare R2 | Video file storage | ~$5/month |
| **Total** | | **~$65/month** |

### Migration Steps

1. Export local PostgreSQL → import to Supabase
2. Update `DATABASE_URL` in Railway env vars to Supabase connection string
3. Upload videos to Cloudflare R2 → process through Cloudflare Stream
4. Update `video_key` in lessons table with Cloudflare Stream video IDs
5. Deploy FastAPI to Railway (connect GitHub repo, auto-deploy)
6. Deploy frontend to Vercel (connect GitHub repo, auto-deploy)
7. Update CORS origins in backend env to include Vercel domain
8. Update `VITE_API_URL` in frontend env to Railway backend URL
9. Run smoke tests on production
10. Point custom domain (if any) to Vercel

### Environment Variables (Production)

**Railway (Backend):**
```env
DATABASE_URL=postgresql+asyncpg://...supabase...
SECRET_KEY=<strong-random-64-char-string>
CORS_ORIGINS=https://your-app.vercel.app
CLOUDFLARE_STREAM_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET=aerolearn-videos
ENVIRONMENT=production
```

**Vercel (Frontend):**
```env
VITE_API_URL=https://your-backend.railway.app
```

---

## 14. Initial Kickoff Prompt for Antigravity

Copy and paste this **exactly** as your first message to Antigravity to kick off backend development:

---

```
You are building the backend for AeroLearn — a premium aviation training LMS for 
Zainco International in Pakistan. I am Saad, the sole developer.

The frontend is already complete. It is a React + Vite app located in:
artifacts/aerolearn/src/

Your job is to build the FastAPI backend that this frontend will connect to.

FIRST: Read these files carefully before writing a single line of code:
1. Read SRS.md in the project root — this is your complete specification
2. Read .antigravity/rules.md — these are your coding rules
3. Read artifacts/aerolearn/src/data/mockData.ts — this is the exact data shape 
   the frontend expects
4. Read artifacts/aerolearn/src/hooks/useAuth.tsx — understand current auth flow
5. Read artifacts/aerolearn/src/App.tsx — understand routes and protection

Once you have read all of the above, begin Phase 1 of the development workflow:

CREATE the following files in a new backend/ folder at the project root:

1. backend/requirements.txt — with all dependencies listed in SRS Section 6
2. backend/.env.example — template with all required env vars (no real values)
3. backend/app/core/config.py — pydantic-settings Settings class
4. backend/app/db/database.py — async SQLAlchemy engine and session
5. backend/app/models/user.py — User SQLAlchemy model
6. backend/app/models/course.py — Course SQLAlchemy model  
7. backend/app/models/lesson.py — Lesson SQLAlchemy model
8. backend/app/models/progress.py — LessonProgress, Enrollment, Activity models
9. backend/app/core/security.py — JWT create/verify + bcrypt hash/verify
10. backend/app/core/deps.py — get_db dependency, get_current_user, require_admin
11. backend/app/schemas/auth.py — LoginRequest, TokenResponse, UserResponse Pydantic schemas
12. backend/app/api/auth.py — POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
13. backend/main.py — FastAPI app with CORS, router includes, /api prefix
14. backend/alembic.ini + backend/alembic/env.py — migrations setup
15. backend/app/db/seed.py — seeds: 2 test users (student + admin) + 4 courses + all lessons from mockData

After creating all files, tell me:
- Exact command to create the database
- Exact command to run migrations
- Exact command to seed the database  
- Exact command to start the dev server
- How to verify auth is working (test curl command)

Do NOT modify anything inside artifacts/aerolearn/. 
Do NOT create any files outside of backend/ in this phase.
Follow all rules in .antigravity/rules.md exactly.
```

---

*End of SRS — Version 1.0.0*  
*Built for Saad / Zainco International*  
*AeroLearn LMS — March 2026*
