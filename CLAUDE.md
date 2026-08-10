# LMS — Project Context for AI Agents

This file is the entry point for any AI agent working in this repository. Read it
fully before starting work. For cross-module orientation, read `.claude/graph.md`
(the live dependency graph, refreshed via the `/graphify` command).

## What this project is

A modern, AI-first **Learning Management System**. Monorepo with three parts:

| Part | Path | Stack |
| --- | --- | --- |
| Backend | `backend/` | Python 3.14, FastAPI, SQLAlchemy 2.0 async + asyncpg, Alembic, Pydantic v2, Redis (asyncio), PyJWT + Argon2 (`pwdlib`), loguru |
| Frontend | `frontend/` | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Router + Query, react-hook-form + zod |
| Infra | `docker-compose.yaml` | PostgreSQL 18, Redis 7.2 |

## Commands

Run from the repo root unless otherwise noted.

### Backend (`backend/`)
- Dev server: `uv run uvicorn src.main:app --reload` (run from `backend/`). Docs: `/docs`, spec: `/api/v1/openapi.json`.
- Typecheck (strict): `uv run mypy .` (from `backend/`)
- Format: `uv run black .` (from `backend/`)
- Migrations: `uv run alembic revision --autogenerate -m "<msg>"`, `uv run alembic upgrade head` (from `backend/`)
- Deps: `pyproject.toml` + `uv.lock` (managed with uv).

### Frontend (`frontend/`)
- Install: `pnpm install` (from `frontend/`)
- Dev: `pnpm dev`
- Lint: `pnpm lint` (ESLint)
- Build (tsc + vite): `pnpm build`
- Regenerate API client: `./scripts/generate-client.sh` from repo root (dumps backend spec to `frontend/openapi.json`, then `pnpm --filter frontend generate-client`).

## Repository structure

```
├── alembic/                # DB migrations (versions/) + alembic.ini
├── backend/src/
│   ├── main.py             # FastAPI app, lifespan (redis), CORS, error handlers
│   ├── core/               # Shared infrastructure — no business logic
│   │   ├── config.py       # pydantic-settings: postgres / app / redis
│   │   ├── router.py       # app_v1; registers ALL feature routers
│   │   ├── dependencies.py # SessionDep, RedisDep, AccessTokenDep
│   │   ├── postgres/       # engine, session, Base/UUIDBase, types, mixins
│   │   ├── redis/          # asyncio redis client
│   │   ├── repositories/   # BaseRepository (generic CRUD)
│   │   ├── unit_of_work/   # BaseUnitOfWork
│   │   ├── mappers/        # BaseMapper
│   │   ├── services/       # BaseService
│   │   ├── schemas/        # BaseSchema + mixins
│   │   ├── errors/         # AppException, ObjectNotFoundError, ObjectAlreadyExistsError
│   │   ├── handlers/       # error handler → {error, detail}
│   │   └── logging/        # loguru setup
│   └── <feature>/          # auth, user, course (+course_member), module,
│                           # lesson (+lesson_progress), block, submissions
├── frontend/src/
│   ├── main.tsx, routes.ts, routeTree.gen.ts
│   ├── app/providers/      # React Query, theme, layout
│   ├── client/             # GENERATED typed API client — DO NOT EDIT
│   ├── components/         # shared UI (components/ui = shadcn) + layout
│   ├── features/           # auth, dashboard, profile, teaching
│   │   └── <feature>/      # api/ (useX hooks), pages/, components/, schemas/
│   ├── lib/                # utils (cn), toast, errors
│   └── routes/             # TanStack Router route files
├── scripts/generate-client.sh
├── frontend/openapi.json   # generated OpenAPI snapshot
├── docker-compose.yaml
└── pyproject.toml          # backend deps + mypy config
```

## Backend architecture

### Layered pattern

Every feature module follows the same dependency direction:

```
router → service → repository / unit_of_work → mapper → schemas → models
```

- `router.py` — thin FastAPI routes; uses `XxxServiceDep` / `UserIdDep` from `dependencies.py`.
- `service.py` — business logic; holds a feature `UnitOfWork`; calls `self.uow.<repo>.*`; raises feature exceptions; commits via `self.uow.commit()`.
- `repository.py` — data access; extends generic `BaseRepository` (model + schema).
- `unit_of_work.py` — composes repositories; extends `BaseUnitOfWork`.
- `mapper.py` — ORM ↔ schema; extends `BaseMapper`.
- `schemas.py` — Pydantic v2 request/response schemas (extend `core.schemas.BaseSchema`).
- `models.py` — SQLAlchemy ORM models (extend `core.postgres.base.UUIDBase`).
- `enums.py` — `StrEnum` (course roles, block types, lesson progress, submission types).
- `exceptions.py` — feature exceptions extending `AppException`.
- `dependencies.py` — DI wiring: `XxxServiceDep = Annotated[Service, Depends(get_service)]`.

### Cross-cutting conventions
- **Everything async.** DB access only through `AsyncSession`/asyncpg; Redis via `redis.asyncio`.
- **IDs** are UUIDs with `gen_random_uuid()` server default (`core/postgres/types.py`, `UUIDMixin`).
- **Timestamps**: `created_at`/`updated_at` timezone-aware (UTC). Soft delete via nullable `is_deleted`.
- **Errors**: raise `AppException` subclasses; global handler (`core/handlers/base_handler.py`) returns `{error, detail}`. Base: `ObjectNotFoundError` (404), `ObjectAlreadyExistsError` (409).
- **Auth**: JWT access/refresh, Argon2 via `pwdlib`; `UserIdDep` (`user/dependencies.py`) decodes current user id.
- **Layering**: business logic lives in services, NOT in routers or repositories; routers are thin.

### Feature modules (full graph in `.claude/graph.md`)
- `auth` — register/login/refresh/logout, `RefreshToken` model, security utils.
- `user` — profiles; exposes `UserIdDep` / `CurrentUserDep`.
- `course` + `course/course_member` — courses and enrollment (`CourseMember`).
- `module` — modules within a course.
- `lesson` + `lesson/lesson_progress` — lessons and per-user progress (`LessonProgress`).
- `block` — content blocks; `BlockType` covers text/quiz(code...)/media; `payload` is JSONB.
- `submissions` — `BlockSubmission` checking via `BlockChecker` registry (`submissions/checker.py`).

## Frontend architecture

- Feature-based: each feature lives in `features/<name>/` with `api/`, `pages/`, `components/`, `schemas/`.
- **API client is generated.** `frontend/src/client/` is produced from `frontend/openapi.json` by `@hey-api/openapi-ts` (`frontend/openapi-ts.config.ts`; plugins: client-fetch, schemas, sdk byTags → `XxxService`, typescript, tanstack/react-query). NEVER edit `src/client/**`.
- Data layer: `features/<name>/api/useX.ts` hooks wrap the generated `...Options()` / `...Mutation()` from `@/client/@tanstack/react-query.gen`, add toasts (`@/lib/toast`) and query invalidation.
- HTTP bootstrap: `src/api/client.ts` (baseUrl from `VITE_API_URL`, auth interceptor with silent refresh, logout on 401).
- Routing: TanStack Router; routes in `src/routes/` + generated `routeTree.gen.ts`; central `ROUTES` constant in `src/routes.ts`.
- UI: shadcn/ui in `components/ui/`; shared layout in `components/layout/` (`Header`, `Footer`, `UserMenu`, `CategoryCatalog`).
- Path alias `@/` → `frontend/src`.

## Critical rules

1. Never edit generated files: `frontend/src/client/**`, `frontend/routeTree.gen.ts`, `frontend/openapi.json`.
2. If a backend API/schema changes, regenerate the client with `./scripts/generate-client.sh` and fix TS usages.
3. Keep the layering: thin routers, business logic in services, data access in repositories.
4. Backend must pass `uv run mypy .` (strict) and `black`. Frontend must pass `pnpm lint` and `pnpm build`.
5. For schema/DB changes, create an Alembic migration.
6. No test framework is configured yet — ask before adding tests.
7. Secrets live in `.env` files; never log or commit them.

## Context system

- `.claude/graph.md` — current module/dependency graph; refresh with `/graphify` after structural changes.
- `.claude/skills/code-review` — load when reviewing or modifying existing code.
- `.claude/skills/architecture-review` — load when planning features or evaluating module boundaries.
- `.opencode/agents/` — subagents: `backend-async`, `frontend`.
- `/graphify` — rescan the repo, rebuild `.claude/graph.md`, and refresh these context files.
