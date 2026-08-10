# LMS — Dependency / Module Graph

> Auto-generated orientation file. Refresh with `/graphify` after structural
> changes. Generated: 2026-08-10 (refreshed by agent scan). Convention: `A → B`
> means "A imports/depends on B".

## 1. Backend — core infrastructure (`backend/src/core/`)

No business logic. Everything below is shared infrastructure.

| Path | Purpose |
| --- | --- |
| `core/config.py` | pydantic-settings: `PostgresSettings`, `AppSettings`, `RedisSettings`, root `settings` |
| `main.py` (`src/main.py`, entry) | FastAPI app factory, lifespan (redis init/close), CORS, error handler registration |
| `core/router.py` | `app_v1` — registers ALL feature routers (`/api/v1` prefix) |
| `core/dependencies.py` | `SessionDep`, `RedisDep`, `AccessTokenDep`, `reusable_oauth2` |
| `core/postgres/engine.py` | async engine (asyncpg) |
| `core/postgres/session.py` | `session_maker`, `get_session` |
| `core/postgres/base.py` | `Base` (DeclarativeBase), `UUIDBase` |
| `core/postgres/mixins.py` | `UUIDMixin` (uuid PK, `gen_random_uuid()`) |
| `core/postgres/types.py` | `uuid_pk`, `int_pk`, `str_128`, `created_at`, `timestamp` |
| `core/redis/client.py` | asyncio redis: `init_redis`, `close_redis` |
| `core/repositories/base_repository.py` | `BaseRepository[T, R]` — generic CRUD (get_filtered [`order_by`]/get_one/create/update/delete) |
| `core/unit_of_work/base_unit_of_work.py` | `BaseUnitOfWork` — async context manager, commit/rollback |
| `core/mappers/base_mapper.py` | `BaseMapper[ORM, Schema]` — `to_schema`/`to_orm`/`update_orm` |
| `core/services/base_service.py` | `BaseService` — holds session |
| `core/schemas/base_schema.py` | `BaseSchema` (from_attributes=True) |
| `core/schemas/mixin.py` | schema mixins (`PolymorphicPayloadMixin` for block/submission payloads) |
| `core/utils.py` | `parse_cors` (CORS origins helper used by `config.py`) |
| `core/errors/base_errors.py` | `AppException`, `ObjectNotFoundError` (404), `ObjectAlreadyExistsError` (409) |
| `core/handlers/base_handler.py` | `init_errors_handler` → `{error, detail}` |
| `core/logging/loguru.py` | `setup_logging` |

Feature modules depend on `core/*`; `core/*` never depends on features.

## 2. Backend — feature modules (`backend/src/<feature>/`)

### Dependency direction
```
router → service → repository / unit_of_work → mapper → schemas → models
```
Plus `enums.py`, `exceptions.py`, `dependencies.py` per feature. New routers
register in `backend/src/core/router.py`.

### auth (`src/auth/`)
Files: `router, services, unit_of_work, repository, mapper, schemas, models,
security, utils, exceptions, dependencies`.
- Router prefix `/auth`, tags `["Auth"]`: `POST /register`, `POST /login`
  (OAuth2 form), `POST /refresh`, `POST /logout`.
- Model: `RefreshToken` (FK `users.id`, token_hash, is_revoked, expires_at).
- Deps on: `user` schemas/models (`UserSchema`), `core/*`.
- `security.py`: JWT encode/decode, Argon2 hashing.

### user (`src/user/`)
Files: `router, service, repository, mappers, schemas, models, exceptions, dependencies`.
- Router prefix `/users`, tags `["Users"]`: `GET /me`, `GET /{user_id}`.
- Model: `User` (username/email unique, password_hash, avatar_url, joined_at,
  is_active, refresh_tokens relationship).
- **Public seam**: `UserIdDep`, `CurrentUserDep`, `UserServiceDep`,
  `UserRepositoryDep` (`dependencies.py`) — consumed by most other features.
- Deps on: `auth.security`/`auth.exceptions` (token decode), `core/*`.

### course (`src/course/`) + `course/course_member`
Files (course): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, enums, dependencies`.
Files (course_member): `schemas, service, repository, mappers, unit_of_work`.
- Router prefix `/courses`, tags `["Courses"]`:
  `POST ""` (create), `PATCH /{course_id}`, `DELETE /{course_id}`,
  `GET ""` (filter=all|created|my), `GET /{course_id}` (filter=current|author|my),
  `POST /{course_id}/members` (enroll).
- Models: `Course` (owner_id→users, title, description, cover_url, price,
  member_count, is_deleted), `CourseMember` (user_id, course_id, role, left_at).
- Enums: `CourseMemberRole` (member/teacher/so_owner).
- **Public seam**: `CourseServiceDep` (`dependencies.py`).
- Deps on: `course_member` (submodule), `user.dependencies` (`UserIdDep`), `core/*`.

### module (`src/module/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, models,
exceptions, dependencies`.
- Router prefix `/courses/{course_id}/modules`, tags `["Modules"]`:
  `POST ""`, `PATCH /reorder` (`ModuleReorderSchema.ordered_ids`),
  `PATCH /{module_id}`, `DELETE /{module_id}`, `GET ""` (only_created).
- Model: `Module` (course_id→courses, title, description, order).
- Repository: `set_order_bulk(course_id, ordered_ids)` (bulk `order` update).
- Deps on: `user.dependencies` (`UserIdDep`), `core/*`.

### lesson (`src/lesson/`) + `lesson/lesson_progress`
Files (lesson): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, enums, dependencies`.
Files (lesson_progress): `router, schemas, repository, mapper, dependencies`.
- Router prefix `/courses/{course_id}/modules/{module_id}/lessons`,
  tags `["Lessons"]`: `POST ""`, `PATCH /reorder` (`LessonReorderSchema`),
  `PATCH /{lesson_id}`, `DELETE /{lesson_id}`, `GET ""` (only_created).
- Repository: `set_order_bulk(module_id, ordered_ids)`.
- Progress router prefix `/lessons/{lesson_id}/progress`,
  tags `["Lessons Progress"]`: `POST ""` → `get_or_create_lesson_progress`.
- Models: `Lesson` (module_id→modules, course_id, title, order),
  `LessonProgress` (user_id, lesson_id, status, completed_at; unique uq_user_lesson_progress).
- Enums: `LessonProgressType` (not_started/in_progress/completed).
- **LessonServiceDep** also powers the lesson_progress router.
- Deps on: `user.dependencies` (`UserIdDep`), `core/*`.

### block (`src/block/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, models,
exceptions, enums, dependencies`.
- Router prefix `/courses/{course_id}/lessons/{lesson_id}/blocks`,
  tags `["Blocks"]`: `POST ""`, `PATCH /reorder` (`BlockReorderSchema`),
  `PATCH /{block_id}`, `DELETE /{block_id}`, `GET ""` (only_created).
- Model: `Block` (lesson_id→lessons, course_id, title, `block_type`, `order`,
  `payload` JSONB). `BlockSubmission` (lesson_id, block_id, user_id,
  submission_type, submitted_payload, attempts, is_first_try_correct; unique
  uq_user_block_submission).
- Repository: `set_order_bulk(lesson_id, ordered_ids)`; lists ordered by
  `order.asc()`.
- Enums: `BlockType` (text/quiz_single_choice/quiz_multiple_choice/code/image/
  video/audio/file), `BlockSubmissionType` (completed/wrong/correct).
- Deps on: `user.dependencies` (`UserIdDep`), `core/*`.

### submissions (`src/submissions/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, exceptions, dependencies, checker`.
- Router prefix `/courses/{course_id}/lessons/{lesson_id}`, tags `["Submissions"]`:
  `POST /submissions` (batch submit blocks).
- `checker.py`: `BlockChecker` registry (`@BlockChecker.register(BlockType)`)
  — checks quiz payloads against correct answers.
- `service.py` `submit_blocks`: validates course membership + full lesson block
  set, checks each block via `BlockChecker`, upserts `BlockSubmission` records
  (attempts++, `submission_type` correct/wrong, `is_first_try_correct`), then
  recalculates `LessonProgress` (COMPLETED only if no wrong; persistent green
  checkmark — once completed, stays completed).
- `BlockSubmissionUnitOfWork` composes: submissions, blocks, lessons,
  lessons_progress, courses, course_members.
- Deps on: `block` schemas/enums (BlockSchema, BlockType, quiz payload schemas),
  `course` (repo + exceptions + course_member repo), `lesson` (service, enums,
  lesson_progress schemas), `user.dependencies` (`UserIdDep`), `core/*`.

### Cross-module dependency summary
```
auth → user, core
user → auth (security/exceptions), core
course → course_member, user, core
module → course (exceptions/repo), user, core
lesson → course + module (exceptions/repos), user, core
        (lesson_progress reuses LessonServiceDep)
block  → course + lesson (exceptions/repos), user, core
submissions → block, course (+course_member), lesson (+lesson_progress),
              user, core
all routers → core.router (app_v1)
```

## 3. Database models & relations

| Table | Model (file) | FKs / unique |
| --- | --- | --- |
| `users` | `User` (`user/models.py`) | username/email unique; is_active; ↔ refresh_tokens |
| `refresh_tokens` | `RefreshToken` (`auth/models.py`) | FK users.id ON DELETE CASCADE |
| `courses` | `Course` (`course/models.py`) | FK users.id (owner_id); title/description/cover_url/price/member_count; soft delete is_deleted |
| `course_members` | `CourseMember` (`course/models.py`) | FK users.id, courses.id; role, left_at |
| `modules` | `Module` (`module/models.py`) | FK courses.id ON DELETE CASCADE |
| `lessons` | `Lesson` (`lesson/models.py`) | FK modules.id (CASCADE), courses.id |
| `lesson_progress` | `LessonProgress` (`lesson/models.py`) | FK users.id, lessons.id; uq_user_lesson_progress |
| `blocks` | `Block` (`block/models.py`) | FK lessons.id (CASCADE), courses.id; order; payload JSONB |
| `block_submissions` | `BlockSubmission` (`block/models.py`) | FK lessons/blocks/users; submitted_payload JSONB; attempts, is_first_try_correct; uq_user_block_submission |

Alembic revision chain (linear, `down_revision` → `revision`):
`719d57e141c5` (base: users/courses/refresh_tokens/modules/lessons/blocks/
block_submissions) → `801e6361c843` (course_id in models) →
`e9bdc2dd629f` (block_type attr) → `d767baa3e278` (lesson_id for blocks) →
`c05cf7919967` (lesson_progress table, block_submissions payload/attempts/
first-try columns, uq) → `e264701752f9` → `cafdbe78a029` (submission_type
renames) → `a4e1ff2972d3` (submission attr rename) → `cf704b7d5f64`
(lesson_progress constraint) → `f547cd198dee` (course_members table,
courses.member_count) → `a1b2c3d4e5f6` (**HEAD**: `blocks.order`, server
default 0). Run `uv run alembic upgrade head` from `backend/`.

## 4. Frontend (`frontend/src/`)

### Structure
```
app/providers/    AppProviders, React Query, theme, layout
api/client.ts     HTTP bootstrap: VITE_API_URL, auth interceptor (silent refresh), 401 logout
client/           GENERATED @hey-api client (sdk.gen.ts, types.gen.ts, schemas.gen.ts,
                  @tanstack/react-query.gen.ts, client.gen.ts) — DO NOT EDIT
components/       ui/ (shadcn) + layout/ (Header, Footer, UserMenu, CategoryCatalog)
features/         auth, dashboard, profile, teaching
lib/              utils (cn), toast, errors, dnd (arrayMove, applyOrderToCache,
                  useReorderableList for drag-and-drop reordering)
routes/           TanStack Router files + routeTree.gen.ts (generated)
routes.ts         central ROUTES constant
```

### Features → api hooks
| Feature | api/ hooks | pages | main routes |
| --- | --- | --- | --- |
| auth | `useAuth` | LoginPage, SignupPage | `/login`, `/signup` |
| dashboard | — (uses course catalog) | RootPage (+ CourseCard, CatalogFilters, types, data/mocks) | `/` |
| profile | — | ProfilePage (streak, achievements, activity, certificates) | `/profile` |
| teaching | `useCourses`, `useModules`, `useLessons`, `useBlocks` (each exposes `reorderXAsync` + optimistic cache update via `lib/dnd`) | TeachingPage, CourseBuilderPage (builder components + QuizSingle/QuizMultipleBlockEditor; CourseModulesList/CourseLessonsList/CourseBlocks/BlockItem are drag-reorderable) | `/teaching`, `/teaching/courses/$courseId` |

Route files: `routes/_layout.tsx`, `_layout/index.tsx` (dashboard),
`_layout/teaching.index.tsx`, `_layout/teaching.courses.$courseId.tsx`,
`_layout/profile.tsx`, `login.tsx`, `signup.tsx`, `__root.tsx`.

### Client pipeline
```
backend spec (main.py .openapi())
   └─ scripts/generate-client.sh → frontend/openapi.json
       └─ pnpm --filter frontend generate-client (@hey-api/openapi-ts)
           └─ frontend/src/client/**  (byTags → AuthService, CourseService, ...)
```
Generated services (from `client/index.ts`): `AuthService, BlockService,
CourseService, DefaultService, LessonService, LessonsProgresService,
ModuleService, SubmissionService, UserService`.

## 5. Key architecture seams (reused everywhere)

- `core.dependencies.SessionDep / RedisDep / AccessTokenDep`
- `user.dependencies.UserIdDep / CurrentUserDep / UserServiceDep`
- `core.router.app_v1` — single registration point for all feature routers
- Generic CRUD via `core.repositories.BaseRepository` + `core.unit_of_work.BaseUnitOfWork`
