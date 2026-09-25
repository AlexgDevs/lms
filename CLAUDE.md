# LMS — Project Context for AI Agents

This file is the entry point for any AI agent working in this repository. Read it
fully before starting work. For cross-module orientation, read `.claude/graph.md`
(the live dependency graph, refreshed via the `/graphify` command).

## What this project is

A modern, AI-first **Learning Management System**. Monorepo with three parts:

| Part | Path | Stack |
| --- | --- | --- |
| Backend | `backend/` | Python 3.14, FastAPI, SQLAlchemy 2.0 async + asyncpg, Alembic, Pydantic v2, Redis (asyncio), PyJWT + Argon2 (`pwdlib`), object storage (local / S3 via aioboto3), loguru |
| Frontend | `frontend/` | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Router + Query, react-hook-form + zod |
| Infra | `docker-compose.yaml` | PostgreSQL 18, Redis 7.2, MinIO (S3 object storage), Mailpit (dev SMTP catcher), Piston (code execution, profile `codeexec`) |

## Commands

Run from the repo root unless otherwise noted.

### Backend (`backend/`)
- Dev server: `uv run uvicorn src.main:app --reload` (run from `backend/`). Docs: `/docs`, spec: `/api/v1/openapi.json`.
- Typecheck (strict): `uv run mypy .` (from `backend/`)
- Format: `uv run black .` (from `backend/`)
- Migrations: `uv run alembic revision --autogenerate -m "<msg>"`, `uv run alembic upgrade head` (from the repo root — `alembic.ini` + `alembic/` live here; `alembic/env.py` imports the backend models)
- Deps: `pyproject.toml` + `uv.lock` (managed with uv).

### AI worker (Celery)
- Run (from `backend/`, Redis required — `docker compose up -d redis`):
  `uv run celery -A src.core.celery_app worker --loglevel=info`
  (or `.\scripts\run-worker.ps1` on Windows). Consumes `ai.tgp.*`, `ai.course_review.*` and `ai.generate.*` tasks (Redis broker).
- AI gateway: OpenAI-compatible endpoint via `AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`
  (default `https://openai.api.proxyapi.ru/v1`, model `openai/gpt-4o`). Without a
  key, TGP generation returns 503.

### Code execution (Piston)
- Start the sandbox (heavy image): `docker compose --profile codeexec up -d piston`.
  Piston v2 needs a cgroup v2 Docker host — on WSL2 add to `%UserProfile%\.wslconfig`
  `[wsl2] kernelCommandLine=cgroup_no_v1=all`, then `wsl --shutdown` and restart Docker.
- The backend talks to Piston via `CODEEXEC_BASE_URL` (default `http://localhost:2000`).
  Without it, CODE submissions with test cases return 503.

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
│   ├── main.py             # FastAPI app, lifespan (redis + storage + realtime fanout), CORS, global rate-limit middleware, static /media, error handlers
│   ├── core/               # Shared infrastructure — no business logic
│   │   ├── config.py       # pydantic-settings: postgres / app / redis / storage / media / ai / tgp / assistant / course_review / course_generate / codeexec / payments / mail / rate_limit / founder
│   │   ├── router.py       # app_v1; registers ALL feature routers (+ WS-only notifications_router mounted by main.py)
│   │   ├── celery_app.py   # Celery app (Redis broker; ai.tgp.* + ai.course_review.* + ai.generate.* tasks)
│   │   ├── dependencies.py # SessionDep, RedisDep, StorageDep, AccessTokenDep, EventBusDep
│   │   ├── postgres/       # engine, session, Base/UUIDBase, types, mixins
│   │   ├── redis/          # asyncio redis client
│   │   ├── storage/        # Storage Protocol + local/S3 backends (factory registry)
│   │   ├── repositories/   # BaseRepository (generic CRUD)
│   │   ├── unit_of_work/   # BaseUnitOfWork
│   │   ├── mappers/        # BaseMapper
│   │   ├── services/       # BaseService
│   │   ├── schemas/        # BaseSchema + mixins + limits.py (shared validation limits, PriceKopeks)
│   │   ├── errors/         # AppException, ObjectNotFoundError, ObjectAlreadyExistsError, RateLimitExceededError
│   │   ├── rate_limit.py   # Redis fixed-window RateLimiter, get_client_ip, RateLimiterDep
│   │   ├── handlers/       # error handler → {error, detail}
│   │   ├── events/         # domain events (event.py, protocol.py, adapter.py) + InMemoryEvent bus
│   │   ├── mailer/         # SMTP via aiosmtplib (verification / reset emails; fail-soft)
│   │   ├── realtime/       # Envelope + EventType + fanout (Redis pub/sub cross-replica WS push)
│   │   ├── websocket/      # ConnectionManager, Connection, UserIdWSDep
│   │   └── logging/        # loguru setup
│   ├── docs/               # per-module docs (e.g. src/auth/docs/auth.en.md|ru.md)
│   └── <feature>/          # auth, user, course (+course_member, +category,
│                           #   +analytics), module, lesson (+lesson_progress),
│                           #   block, submissions, codeexec (Piston client),
│                           #   media (+media_attachment), profile (read-only stats),
│                           #   certificate, review, payment, notification, founder,
│                           #   ai (+ai/tgp, +ai/assistant, +ai/course_review, +ai/generate)
├── frontend/src/
│   ├── main.tsx, routes.ts, routeTree.gen.ts
│   ├── app/providers/      # React Query, theme, layout
│   ├── client/             # GENERATED typed API client — DO NOT EDIT
│   ├── components/         # shared UI (components/ui = shadcn) + layout
│   ├── features/           # admin, auth, certificate, dashboard, learner, legal, media, notification, payment, profile, review, settings, teaching
│   │   └── <feature>/      # api/ (useX hooks), pages/, components/, schemas/
│   ├── lib/                # utils (cn), toast, errors, dnd, media, tgp (cooldowns), price (kopeks ↔ ₽)
│   ├── styles/             # Tailwind v4 design system (tokens/semantic/themes)
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
- **Auth**: JWT access/refresh, Argon2 via `pwdlib`; `UserIdDep` (`user/dependencies.py`) decodes current user id. **Email-verification gate**: `UserIdDep`/`CurrentUserDep`/`StaffDep` raise `UserNotVerifiedError` (403) unless `is_verified`; `AuthenticatedUserIdDep`/`AuthenticatedCurrentUserDep` are auth-only (no verify); `OptionalUserIdDep` is anonymous/public.
- **Storage**: all file I/O goes through `core.storage.Storage` (Protocol; local/S3 via `STORAGE_BACKEND`, factory registry in `core/storage/factory.py`); media routes use `StorageDep`.
- **Rate limiting**: Redis fixed-window (`core/rate_limit.py`) — a global per-IP middleware in `main.py` (fail-open, exempt `/media/`, `/ws/`, `/docs`), login/forgot/resend limits in `auth`, submit limits in `submissions`; 429 → `RateLimitExceededError` with `Retry-After`.
- **Money in kopeks**: `courses.price` and `payments.amount/platform_fee/author_amount` are integers in kopeks (converted by migration `d4e5f6a7b8c9`); validate with `core/schemas/limits.py` `PriceKopeks`; format on the frontend via `lib/price.ts`.
- **Content access invariants**: `course/access.py` — content edits only while the course is not published, content with student results can't be deleted, course removal blocked by members/payments (`ensure_course_removable`).
- **Layering**: business logic lives in services, NOT in routers or repositories; routers are thin.

### Feature modules (full graph in `.claude/graph.md`)
- `auth` — register/login/refresh/logout (rotation, reuse-detection), sessions
  (`GET/DELETE /auth/sessions`), password reset, **email verification**
  (`verify-email`, `resend-verification`); `RefreshToken` model + `device_parser`;
  login (per-user + per-IP) and email limits via `core.rate_limit`.
- `user` — profiles; exposes `UserIdDep` / `CurrentUserDep` / `StaffDep`
  (verified) and `AuthenticatedUserIdDep` / `AuthenticatedCurrentUserDep`
  (auth-only) + `OptionalUserIdDep` (public); `is_staff` + `is_verified` +
  `is_founder` + `notifications_enabled` flags;
  `GET/PATCH /users/me` return `UserMeSchema` (no `password_hash`), `DELETE /me`
  soft-deletes/anonymizes; promote the first admin via
  `scripts/promote_admin.py <email-or-username>`.
- `course` + `course/course_member` + `course/category` + `course/analytics` —
  courses, enrollment (`CourseMember`), the category tree (`Category`, seeded via
  Alembic) and owner-only analytics (`GET /courses/{id}/analytics`...);
  `CourseSchema` includes `owner_username` (resolved by service on read);
  `CourseStatus` (draft/under_review/published/rejected) and moderation:
  owner `PATCH /courses/{id}` may only set `status=draft`; owner
  `POST /courses/{id}/submit` runs a completeness check (description, ≥1
  module/lesson, ≥`course_review.min_blocks` blocks) then enqueues Celery
  `ai.course_review.review`; staff `GET /courses/moderation/queue`,
  `POST /courses/{id}/moderation/approve|reject` (reject requires `reason` →
  `courses.moderation_reason`, visible to the owner in the builder).
  **anonymous public read** of published courses
  (`GET /courses` with `filter=all`, `GET /courses/{id}` with `filter=current`,
  via `OptionalUserIdDep`); `CourseSchema.is_member` resolved per viewer on read;
  search via `q` (pg_trgm GIN indexes on title/description) and category filter by
  `category=<slug>` (parent + children); cover upload/remove
  (`POST/DELETE /courses/{id}/media`) via `MediaService`; price stored in
  **kopeks**; `CourseSchema` also resolves `owner_is_founder` + `tgp_outdated`
  (structure drift vs `courses.tgp_content_snapshot`). **`course/access.py`**
  enforces the Phase-2 invariants (draft-only content edits, protected
  deletions, `ensure_course_removable`); publishing grants the owner the
  lifetime Founder status.
- `founder` — Founder program: public `GET /founder/progress` (count, quota,
  revenue in kopeks from `settings.founder`) and
  `grant_founder_if_eligible()` (idempotent; closes only when BOTH the author
  quota and revenue limit are hit) called from course publish and AI
  auto-approve (`ai/course_review`). No own tables.
- `module` — modules within a course.
- `lesson` + `lesson/lesson_progress` — lessons and per-user progress
  (`LessonProgress`); progress endpoints also include `GET /courses/{id}/progress`.
- `block` — content blocks; `BlockType` covers text/quiz(code...)/media; `payload`
  is JSONB; text blocks accept `text` or rich-text `html` (TipTap, sanitized via
  nh3); media blocks bind a `MediaAttachment` (create/update reconcile, delete
  detach), resolve `payload.url` on read, and support upload via `POST /blocks/{id}/media`.
- `submissions` — `BlockSubmission` checking via `BlockChecker` registry
  (`submissions/checker.py`); batch lesson submit, single-step block submit, and
  per-lesson submission listing. CODE blocks are auto-graded: the registered
  `check_code` runs the student's solution against the block's `test_cases`
  (stdin → expected stdout) via `codeexec`.
- `codeexec` — Piston (engine-manager) HTTP client (`/api/v2/execute`); used by the
  CODE `BlockChecker`. Language aliases python/javascript/typescript/go, per-case
  run/compile timeouts and memory limits from `CodeExecSettings`
  (`CODEEXEC_*` env). No DB tables or routes. Requires Piston reachable at
  `CODEEXEC_BASE_URL` (docker-compose profile `codeexec`; dev needs cgroup v2,
  e.g. `.wslconfig` → `kernelCommandLine=cgroup_no_v1=all`).
- `media` + `media/media_attachment` — uploads (local/S3 storage), per-owner listing, presigned URLs, delete protection via generic `MediaAttachment` (owner_type/owner_id/role); service used by `block` and `course`.
- `profile` — read-only stats (`GET /users/me/stats`): streak, weekly (7-day) and yearly (365-day contribution grid) computed from `lesson_progress.completed_at`; no own tables — reuses `LessonProgress` (router/service/repository/schemas/dependencies only).
- `certificate` — course-completion PDFs (reportlab) + storage; `GET /users/me/certificates`
  (list) and `GET /courses/{id}/certificate` (download, lazy gen); `Certificate` model.
- `review` — polymorphic ratings/reviews (`target_type` course|user|lesson); root
  review + nested replies in one `Review` table; aggregate `GET /reviews/.../rating`.
- `payment` — YooKassa SBP checkout + webhook (IP allow-listed), purchase history,
  payout account (`PayoutAccount`); `POST /payments/courses/{id}/checkout` (verified),
  `GET /payments/me`, `GET|PUT|DELETE /payments/payout-account` (auth-only).
  All money fields in **kopeks**; module docs in `payment/docs/`.
- `notification` — per-user notifications from domain events (`NotificationHandler`
  subscribes to `core.events`, honors `users.notifications_enabled`, pushes via
  `core.realtime.fanout` → Redis pub/sub → local WS connections on every replica);
  `Notification` model; REST endpoints are auth-only and registered in `app_v1`;
  only the WS route lives on the separate root-mounted `notifications_router`.
- `ai/generate` — AI course-structure generator: `CourseService.generate_course_ai`
  creates a DRAFT course and enqueues `ai.generate.course_generate_task`.
- `ai` — shared Gemini/OpenAI-compatible client (`ai/gemini.py`, `src/ai/exceptions.py`
  with generic `AiError`/`AiNotConfiguredError`/`AiRateLimitError`/`AiUnavailableError`)
  plus four features:
  - `ai/tgp` — TGP (The Golden Path) pre-course placement testing: `TgpQuestion`
    bank per course/module; async generation via Celery (`ai.tgp.generate`,
    `ai.tgp.regenerate_question`, Redis broker + `tgp:generating:{course_id}` lock)
    through `core/celery_app.py`; `submit` → per-module scores → Gemini evaluation
    (RECOMMENDED/OPTIONAL + verdict) with a deterministic threshold fallback.
  - `ai/assistant` — inline learner assistant (hint / streaming `ask` via SSE /
    level regeneration) with Redis cooldowns, per-user rate limits and a cached
    "ladder" of hint levels. Enums in `ai/assistant/enums.py`
    (`AssistantFocus` / `AssistantAngle` / `AssistantAction`).
  - `ai/course_review` — moderation pre-screen: Celery task `ai.course_review.review`
    (Redis lock `course_review:{course_id}`, retries on rate-limit/network, heuristic
    fallback when no AI key) runs `GeminiService.review_course` over gathered text/
    quiz/code content; AI `approved` → auto-publish (grants Founder via
    `founder.grant_founder_if_eligible`), AI `flagged` → stays `under_review`
    with `moderation_reason` for the manual queue (thresholds via
    `settings.course_review`).
  - `ai/generate` — AI course-structure generator (Celery `ai.generate.course_generate_task`,
    Redis lock `course_generate:{course_id}`; prompt templates in
    `ai/prompts/generate/` (loader `ai/prompts/loader.py`), plan schemas in
    `ai/generate/schemas.py`).

## Frontend architecture

- Feature-based: each feature lives in `features/<name>/` with `api/`, `pages/`, `components/`, `schemas/`.
- **API client is generated.** `frontend/src/client/` is produced from `frontend/openapi.json` by `@hey-api/openapi-ts` (`frontend/openapi-ts.config.ts`; plugins: client-fetch, schemas, sdk byTags → `XxxService`, typescript, tanstack/react-query). NEVER edit `src/client/**`.
- Data layer: `features/<name>/api/useX.ts` hooks wrap the generated `...Options()` / `...Mutation()` from `@/client/@tanstack/react-query.gen`, add toasts (`@/lib/toast`) and query invalidation.
- HTTP bootstrap: `src/api/client.ts` (baseUrl from `VITE_API_URL`, auth interceptor with silent refresh; 401 → logout only if an access token was present, so anonymous requests never redirect to `/login`; 403 `UserNotVerifiedError` → redirect to `/verify-email`).
- Routing: TanStack Router; routes in `src/routes/` + generated `routeTree.gen.ts`; central `ROUTES` constant in `src/routes.ts`.
- UI: shadcn/ui in `components/ui/`; shared layout in `components/layout/` (`Header`, `Footer`, `UserMenu`, `CategoryCatalog`, `Layout`).
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
