# LMS

A modern, AI-first **Learning Management System**. LMS helps educators build courses and learners study effectively — with adaptive learning paths, a proactive AI assistant that keeps students on track, and AI-assisted course authoring.

Unlike conventional LMS platforms, LMS is designed around three "killer" capabilities described below. The project is currently in early development.

## Highlights — Killer Features

### 1. Adaptive Pre-Assessment & Personal Roadmap

On enrolling, a student takes a **pre-assessment test** for the course. The results feed an automatic knowledge audit that builds a **personal learning roadmap**, skipping the material the student already knows.

- Automated knowledge audit instead of manual "what do I skip?" filtering.
- A personalized path through the course based on actual knowledge.
- Students spend time only on what they don't know yet.

### 2. AI Study Assistant with Trigger-Based Intervention

An intelligent assistant that actively **reduces drop-out**. When a student fails several attempts in a row, a **trigger** fires: the assistant analyzes the current lesson and the student's input, then generates micro-tasks and tests that lead the student step by step to the result.

- Proactive help at the exact moment a student gets stuck.
- Context-aware: works from the current lesson content and the student's answers.
- Micro-exercises and quizzes tuned to the student's weak points.

### 3. AI Course Generation

Course authors can **generate a full course draft with AI** and then edit it in the builder.

- Dramatically speeds up course production.
- Generated courses stay fully editable (modules, lessons, blocks).
- Lets educators iterate fast from idea to published course.

## Status

- **Version:** 0.1.0 (early development).
- The three killer features above are **planned product vision** — see [Roadmap](#roadmap).
- Currently implemented: authentication, user profiles, course management (modules → lessons → blocks), lesson progress and submissions.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Python 3.14, FastAPI, SQLAlchemy 2.0 (async) + asyncpg, Alembic, Pydantic v2 / pydantic-settings |
| Auth & Security | PyJWT, Argon2 (`pwdlib`), OAuth2 |
| Cache / Infra | Redis (asyncio), Docker Compose (PostgreSQL 18, Redis 7.2) |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui |
| Frontend Data | TanStack Router, TanStack Query, react-hook-form + zod, sonner, lucide-react |
| API Codegen | @hey-api/openapi-ts → typed client (`@tanstack/react-query` plugin) |
| Quality | mypy (strict), black, ESLint |

## Architecture

Monorepo with three parts: the FastAPI backend, the React frontend, and shared tooling.

### Backend

Modular, domain-driven layout. Every feature module (`auth`, `user`, `course`, `module`, `lesson`, `lesson_progress`, `block`, `submissions`) follows the same layered pattern:

`router → service → repository / unit-of-work → mapper → schemas → models`

Shared infrastructure lives in `backend/src/core/`: config, PostgreSQL engine/session, Redis client, error handlers, logging (loguru), base repository and unit-of-work classes.

The API is served under the `/api/v1/` prefix (see `backend/src/main.py` and `backend/src/core/router.py`).

### Frontend

Feature-based structure: shared UI in `components/`, feature-scoped code under `features/` (`auth`, `dashboard`, `profile`, `teaching`), app-wide providers in `app/providers/`, and shared helpers in `lib/`.

The API client is **generated** from `frontend/openapi.json` into `frontend/src/client/` — never edit generated files by hand.

## Repository Structure

```
.
├── alembic/                 # Database migrations
├── backend/
│   └── src/
│       ├── main.py          # FastAPI app entry point
│       ├── core/            # Shared infrastructure (config, postgres, redis, errors, logging)
│       └── <feature>/       # auth, user, course, module, lesson, block, submissions, ...
├── frontend/
│   ├── src/
│   │   ├── app/providers/   # Theme, layout, React Query providers
│   │   ├── client/          # Generated typed API client (do not edit)
│   │   ├── components/      # Shared layout + UI components
│   │   ├── features/        # Feature-scoped code (auth, dashboard, profile, teaching)
│   │   ├── lib/             # Shared utilities (toasts, errors, cn)
│   │   └── routes/          # TanStack Router routes
│   └── openapi-ts.config.ts # Client codegen config
├── scripts/
│   └── generate-client.sh   # Regenerates the frontend API client
├── docker-compose.yaml      # PostgreSQL + Redis
├── openapi.json             # Backend OpenAPI snapshot (generated)
└── pyproject.toml           # Backend deps, mypy config
```

## Getting Started

### Prerequisites

- Python 3.14+ with [uv](https://docs.astral.sh/uv/)
- [pnpm](https://pnpm.io/)
- Docker (for PostgreSQL and Redis)

### 1. Infrastructure

```bash
cp .env.example .env        # PostgreSQL, JWT, Redis, CORS settings
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # if not already configured
uv run uvicorn src.main:app --reload
```

The API docs are available at `http://127.0.0.1:8000/api/v1/openapi.json` (Swagger UI at `/docs`).

### 3. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env        # set VITE_API_URL=http://127.0.0.1:8000
pnpm dev
```

## Development Workflow

- **Migrations:** managed with Alembic (migration files in `alembic/`).
- **API client codegen:** after backend changes, regenerate the frontend client:

  ```bash
  ./scripts/generate-client.sh
  ```

  This dumps the backend OpenAPI spec into `frontend/openapi.json` and runs `pnpm --filter frontend generate-client`.

- **Frontend quality:**

  ```bash
  pnpm lint
  pnpm build
  ```

- **Backend quality:** mypy (strict mode) and black are configured in `pyproject.toml`.

## Roadmap

**Implemented (v0.1.0):**

- Authentication & registration (JWT, Argon2, refresh tokens)
- User profiles
- Course authoring: courses → modules → lessons → blocks
- Lesson progress tracking and submission checking

**Next up (product vision):**

- [ ] Pre-assessment tests and automatic personal roadmap generation
- [ ] AI study assistant with trigger-based drop-out intervention
- [ ] AI course generation with manual editing in the builder

## License

Not yet specified.
