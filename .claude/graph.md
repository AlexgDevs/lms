# LMS — Dependency / Module Graph

> Auto-generated orientation file. Refresh with `/graphify` after structural
> changes. Generated: 2026-08-19 (refreshed by agent scan). Convention: `A → B`
> means "A imports/depends on B".

## 1. Backend — core infrastructure (`backend/src/core/`)

No business logic. Everything below is shared infrastructure.

| Path | Purpose |
| --- | --- |
| `core/config.py` | pydantic-settings: `PostgresSettings`, `AppSettings`, `RedisSettings`, `StorageSettings`, `MediaSettings`, `AIGatewaySettings` (`AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`), `TgpSettings` (cooldowns, retries, question counts), root `settings` |
| `main.py` (`src/main.py`, entry) | FastAPI app factory, lifespan (redis + storage init/close), CORS, static `/media` mount (local backend), error handler registration |
| `core/router.py` | `app_v1` — registers ALL feature routers (`/api/v1` prefix) |
| `core/celery_app.py` | Celery app (`broker`/`backend` = Redis; `worker_pool="solo"` for Windows dev; includes `src.ai.tasks`) |
| `core/dependencies.py` | `SessionDep`, `RedisDep`, `StorageDep`, `AccessTokenDep`, `reusable_oauth2` |
| `core/postgres/engine.py` | async engine (asyncpg) |
| `core/postgres/session.py` | `session_maker`, `get_session` |
| `core/postgres/base.py` | `Base` (DeclarativeBase), `UUIDBase` |
| `core/postgres/mixins.py` | `UUIDMixin` (uuid PK, `gen_random_uuid()`) |
| `core/postgres/types.py` | `uuid_pk`, `int_pk`, `str_128`, `created_at`, `timestamp` |
| `core/redis/client.py` | asyncio redis: `init_redis`, `close_redis` |
| `core/storage/protocol.py` | `Storage` Protocol + `StorageObjectMeta` (upload/download/delete/exists/metadata/presigned/public URL) |
| `core/storage/local.py` | `LocalStorage` (filesystem backend, base_url `/media`) |
| `core/storage/s3.py` | `S3Storage` (aioboto3, presigned URLs) |
| `core/storage/factory.py` | `@register_storage(name)` registry + `build_storage()` (select via `STORAGE_BACKEND`) |
| `core/storage/errors.py` | `StorageError`, `StorageObjectNotFoundError` |
| `core/storage/__init__.py` | `init_storage`, `close_storage`; re-exports Storage/LocalStorage/S3Storage |
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

Storage note: object storage mirrors the `core/redis` pattern — a `Storage`
abstraction with pluggable backends (`STORAGE_BACKEND=local|s3`). No business
logic; keys are built by callers (e.g. `media/<uuid><ext>` in the media service).

Celery note: `core/celery_app.py` is the single Celery entrypoint; `ai/tasks.py`
registers the `ai.tgp.*` tasks and builds its own engine/session factory
(`NullPool`) + Redis client inside the worker process (separate from FastAPI).

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
- Router prefix `/users`, tags `["Users"]`: `GET /me`, `PATCH /me`
  (`UserUpdateRequestSchema` → `update_user`), `GET /{user_id}`.
- Model: `User` (username/email unique, password_hash, avatar_url, joined_at,
  is_active, refresh_tokens relationship).
- **Public seam**: `UserIdDep`, `OptionalUserIdDep`, `CurrentUserDep`,
  `UserServiceDep`, `UserRepositoryDep` (`dependencies.py`) — consumed by most
  other features.
- Deps on: `auth.security`/`auth.exceptions` (token decode), `core/*`.

### course (`src/course/`) + `course/course_member` + `course/category`
Files (course): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, enums, dependencies`.
Files (course_member): `schemas, service, repository, mappers, unit_of_work`.
Files (category): `router, service, repository, mapper, schemas, models,
dependencies` — standalone read-only router (`GET /categories`).
- Router prefix `/courses`, tags `["Courses"]`:
  `POST ""` (create), `PATCH /{course_id}`, `DELETE /{course_id}`,
  `GET ""` (filter=all|created|my, `limit`/`offset`, `category` slug,
  `q` search), `GET /{course_id}` (filter=current|author|my),
  `POST /{course_id}/members` (enroll), `POST /{course_id}/media` (upload cover,
  multipart `file` + `is_public` → `CourseSchema`), `DELETE /{course_id}/media`
  (remove cover, 204).
- **Public read (anonymous)**: both GETs take `OptionalUserIdDep` — `filter=all`
  and `filter=current` return only `status=published` courses and work with no
  token (no security scheme in OpenAPI); `filter=created|my|author` require a
  token (`user_id=None` → `InvalidAccessTokenError` 401).
- **Search**: `q` (≤100 chars) → `CourseRepository.get_filtered(search_term=...)`
  with pg_trgm relevance ordering (prefix `ilike` first, then `ts_rank`, then
  `word_similarity`, then `member_count`). GIN trgm indexes on title/description
  (migration `4b7d1c9e2f8a`).
- **Categories**: `Course.category_id` (FK SET NULL). `category=<slug>` resolves
  the category + its children (`_resolve_category_ids`) and filters `filter=all`.
  Category tree is seeded via Alembic (uuid5 slugs).
- Models: `Course` (owner_id→users, title, description, cover_url, price,
  category_id, member_count, status, is_deleted, `tgp_enabled`,
  `tgp_last_full_generated_at`, `tgp_cooldown_hours`), `CourseMember`
  (user_id, course_id, role, left_at, `tgp_last_submitted_at`),
  `Category` (name, slug unique, icon, parent_id self-FK CASCADE, sort_order).
- Enums: `CourseMemberRole` (member/teacher/so_owner), `CourseStatus`
  (draft/published).
- Media cover: `cover_url` is a server-generated public storage URL. Upload
  attaches a `MediaAttachment(owner_type=course, role=cover)` and replaces the
  previous cover (old media purged after commit if unreferenced); remove detaches
  and purges. `CourseUnitOfWork` composes `media` + `media_attachments` +
  `categories` repos; `CourseServiceDep` injects `MediaServiceDep`.
- **Public seam**: `CourseServiceDep` (`course/dependencies.py`),
  `CategoryServiceDep` (`course/category/dependencies.py`).
- Deps on: `course_member` (submodule), `course/category` (submodule), `media`
  (+`media_attachment` repos, `MediaService`), `user.dependencies`
  (`UserIdDep`/`OptionalUserIdDep`), `core/*`.

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
- Progress routers (tags `["Lessons Progress"]`):
  `POST /lessons/{lesson_id}/progress` → `get_or_create_lesson_progress`;
  `GET /courses/{course_id}/progress` (`course_progress_router`) →
  `LessonService.get_course_progress` (all per-user progress in a course).
- Models: `Lesson` (module_id→modules, course_id, title, order),
  `LessonProgress` (user_id, lesson_id, status, completed_at; unique uq_user_lesson_progress).
- Enums: `LessonProgressType` (not_started/in_progress/completed).
- **LessonServiceDep** also powers the lesson_progress routers.
- Deps on: `user.dependencies` (`UserIdDep`), `core/*`.

### block (`src/block/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, models,
exceptions, enums, dependencies`.
- Router prefix `/courses/{course_id}/lessons/{lesson_id}/blocks`,
  tags `["Blocks"]`: `POST ""`, `PATCH /reorder` (`BlockReorderSchema`),
  `PATCH /{block_id}`, `DELETE /{block_id}`, `GET ""` (`only_created` → owner path,
  otherwise member path), `POST /{block_id}/media` (multipart upload →
  `BlockSchema`; only for media block types).
- Model: `Block` (lesson_id→lessons, course_id, title, `block_type`, `order`,
  `payload` JSONB). `BlockSubmission` (lesson_id, block_id, user_id,
  submission_type, submitted_payload, attempts, is_first_try_correct; unique
  uq_user_block_submission).
- **Text blocks (TipTap)**: `TextBlockContent` accepts `text` **or** `html`
  (at least one required). On create/update of `TEXT` blocks, `payload.html` is
  sanitized via `nh3.clean` (max 100k chars) to prevent XSS on the learner read
  path (`_sanitize_text_payload`). BlockType enum is unchanged.
- Media: media block types (`IMAGE/VIDEO/AUDIO/FILE`) carry `media_id` in
  `payload` (cache); `BlockService` validates ownership, **attaches** a
  `MediaAttachment` on create, **reconciles** (detach-all + re-attach) on update,
  **detaches** on delete, and on every read **resolves `payload.url` from the
  block's `MediaAttachment` rows** (attachment is authoritative, not the payload
  cache): public → storage URL, private → presigned URL. `POST /{block_id}/media`
  uploads + attaches (old media purged after commit if unreferenced); non-media
  block types → `BlockTypeNotMediaError` (422). `BlockUnitOfWork` composes
  `media` + `media_attachments` repos; `BlockServiceDep` injects `MediaServiceDep`
  + `StorageDep`. Learner read path also **strips correct answers** from quiz
  payloads (`_strip_quiz_answers`).
- Content schemas: `TextBlockContent` (text|html), `ImageBlockContent`,
  `VideoBlockContent`, `AudioBlockContent`, `FileBlockContent` (all media ones
  with optional `url` + `media_id`), quiz schemas (`QuizSingleBlockContent`,
  `QuizMultipleBlockContent`).
- Repository: `set_order_bulk(lesson_id, ordered_ids)`; lists ordered by
  `order.asc()`.
- Enums: `BlockType` (text/quiz_single_choice/quiz_multiple_choice/code/image/
  video/audio/file), `BlockSubmissionType` (completed/wrong/correct).
- Exceptions: `BlockTypeNotMediaError` (422).
- Deps on: `course`, `lesson` (exceptions/repos), `media` (+`media_attachment`
  repos + `MediaForbiddenError`/`MediaNotFoundError` + `MediaService`),
  `user.dependencies` (`UserIdDep`), `core.storage`, `core/*`.

### submissions (`src/submissions/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, exceptions, dependencies, checker`.
- Router prefix `/courses/{course_id}/lessons/{lesson_id}`, tags `["Submissions"]`:
  `POST /submissions` (batch submit blocks),
  `POST /blocks/{block_id}/submission` (**single-step submit**, Stepik-style),
  `GET /submissions` (current user's submissions for a lesson).
- `checker.py`: `BlockChecker` registry (`@BlockChecker.register(BlockType)`)
  — checks quiz payloads against correct answers.
- `service.py`:
  - `submit_blocks` (batch): validates course membership + full lesson block
    set, checks each block via `BlockChecker`, upserts `BlockSubmission` records
    (attempts++, `submission_type` correct/wrong, `is_first_try_correct`), then
    recalculates `LessonProgress` (COMPLETED only if no wrong; persistent green
    checkmark — once completed, stays completed).
  - `submit_block` (single): grades one block, persists attempt history,
    re-computes lesson progress; reports the fresh evaluation to the learner
    even when the persisted status stays green.
  - `get_lesson_submissions`: returns the user's submissions for a lesson.
- `BlockSubmissionUnitOfWork` composes: submissions, blocks, lessons,
  lessons_progress, courses, course_members.
- Deps on: `block` schemas/enums (BlockSchema, BlockType, quiz payload schemas),
  `course` (repo + exceptions + course_member repo), `lesson` (service, enums,
  lesson_progress schemas), `user.dependencies` (`UserIdDep`), `core/*`.

### media (`src/media/`) + `media/media_attachment`
Files (media): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, dependencies, __init__`.
Files (media_attachment): `models, schemas, mappers, repository, exceptions,
enums, __init__` — **no router/service** (support module).
- Router prefix `/media`, tags `["Media"]`: `POST ""` (multipart upload, form
  `is_public`), `GET ""` (my media), `GET /{media_id}`,
  `GET /{media_id}/url` (`expires_in`), `DELETE /{media_id}` (204).
  `POST/GET` respond with `MediaResponseSchema` — public fields + resolved
  `url` (public → storage URL, private → presigned), **no** `storage_key`.
- Model: `Media` (owner_id→users CASCADE, original_name, storage_key,
  content_type, size_bytes, etag, is_public).
- Model: `MediaAttachment` (media_id→media CASCADE, owner_type, owner_id, role,
  position; unique `uq_media_attachment` on media_id+owner_type+owner_id+role;
  indexes on media_id, owner_id) — generic "owner ↔ media" join, reusable for
  course covers / user avatars later. **Source of truth** for owner→media
  resolution (write path mirrors it into `Block.payload.media_id` as a cache).
- Enums: `MediaAttachmentRole` (content/cover/avatar), `MediaOwnerType`
  (block/course/user).
- Repository: `attach`, `detach_all`, `get_for_owner`, `get_for_owners`
  (batch IN), `get_media_ids_for_owner`, `is_referenced`, `get_owners`
  (reverse lookup); `MediaRepository.get_by_ids`.
- `MediaService`: `create_media` (size/type validation → upload → DB row with
  orphan cleanup on failure; `commit=False` flag so callers can embed it in their
  UoW transaction), `get_media` (owner/privacy check), `list_my_media`,
  `get_media_url` (public URL vs presigned), `to_response`/`to_response_list`
  (map `MediaSchema` → `MediaResponseSchema` with resolved `url`),
  `delete_media` (refuses while referenced by any `MediaAttachment` →
  `MediaInUseError`), `cleanup_unreferenced(media_ids)` (purges files + rows
  after commit).
- Exceptions: `MediaNotFoundError` (404), `MediaForbiddenError` (403),
  `MediaTooLargeError` (413), `MediaTypeNotAllowedError` (415),
  `MediaInUseError` (409). Limits/types come from `settings.media`.
- **Public seam**: `MediaServiceDep`, `MediaRepositoryDep`,
  `MediaAttachmentRepositoryDep` (`media/dependencies.py`) — consumed by `block`
  and `course`.
- Deps on: `core.storage`, `user.dependencies` (`UserIdDep`), `core/*`.

### ai (`src/ai/`) — AI TGP (The Golden Path) pre-course testing
Files: `router, service, tasks, gemini, unit_of_work, repository, mapper,
schemas, models, enums, exceptions, dependencies`.
- Router prefix `/ai/tgp`, tags `["AI TGP"]`:
  `GET /{course_id}/questions` (list, member/owner gated),
  `POST /{course_id}/generate` (202, **queues a Celery task**; owner only),
  `POST /questions/{question_id}/regenerate` (202, queues Celery task; owner only),
  `PATCH /questions/{question_id}` (manual edit; owner only),
  `POST /{course_id}/submit` (answers → per-module recommendations + verdict).
- Model: `TgpQuestion` (course_id→courses, module_id→modules, question_text,
  `options` JSONB, correct_option; ix on course_id).
- Enums: `TgpDecision` (RECOMMENDED/OPTIONAL).
- Celery tasks (`ai/tasks.py`, consumed by worker):
  `ai.tgp.generate` (`generate_tgp_test_task`) — patches existing questions in
  place (stable ids), creates new / deletes leftovers per module, updates
  `tgp_last_full_generated_at`; `ai.tgp.regenerate_question`
  (`regenerate_single_question_task`). Both build a private engine/session +
  Redis inside the worker, hold a Redis lock `tgp:generating:{course_id}`
  (Lua release/extend scripts), and retry on rate-limit (Retry-After) / network
  errors with backoff.
- `gemini.py`: `GeminiService` — OpenAI-compatible chat client
  (`settings.ai.AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`); generates question banks,
  regenerates single questions, evaluates submissions; dataclasses
  `ModuleStructure`/`GeneratedQuestion`/`ModuleStat`/`ModuleRecommendation`/
  `EvaluationResult`; strict JSON validation.
- `service.py` `AiService`: `generate` (course + TGP enabled + AI key checks,
  full-regeneration cooldown [max of `tgp_cooldown_hours` and the 24h floor],
  ≥`TGP_MIN_MODULES`, Redis lock → `.delay`), `regenerate_question`
  (per-question 1h cooldown), `get_questions` (owner or published-member),
  `update_question`, `submit` (24h submit cooldown via
  `CourseMember.tgp_last_submitted_at`, exact answer-set validation, per-module
  scores → Gemini evaluation with deterministic threshold fallback →
  `TgpSubmitResponseSchema {modules[], verdict}`).
- `AiUnitOfWork` composes: questions, courses, modules, members.
- Exceptions (`TgpError` hierarchy): `TgpNotEnabledError` (404),
  `TgpQuestionNotFoundError` (404), `TgpNoQuestionsError` (409),
  `TgpInvalidAnswersError` (422), `NotEnoughModulesError` (422),
  `TgpCooldownError` (425), `TgpGenerationInProgressError` (425),
  `TgpAiNotConfiguredError` (503), `TgpAiUnavailableError` (503),
  `TgpGeminiRateLimitError` (503, `retry_after`), `TgpAiResponseError` (502).
- **Public seam**: `AiServiceDep` (`ai/dependencies.py`).
- Deps on: `course` (+`course_member` repo/schemas, enums, exceptions), `module`
  (repo, models), `user.dependencies` (`UserIdDep`), `core.config`, `core.redis`,
  `core.celery_app`, `core/*`.

### profile (`src/profile/`)
Files: `router, service, schemas, repository, dependencies`.
- **Read-only stats module** — no own model/mapper/exceptions/enums/unit_of_work;
  computes profile activity by aggregating `lesson.models.LessonProgress`
  (`completed_at`) via the `lesson_progress` mapper + schemas.
- Router prefix `/users/me`, tags `["Profile"]`: `GET /stats` →
  `ProfileStatsSchema {streak:{current,longest}, weekly[7], yearly[365]}`.
  Uses `UserIdDep` + `ProfileServiceDep`.
- `service.py`: `get_stats` builds weekly (`DayActivitySchema`) and yearly
  (`ContributionDaySchema`, 365-day heatmap) grids and current/longest streak
  from the set of days with completed lessons.
- `repository.py`: `ProfileRepository[LessonProgress, LessonProgressSchema]`
  with `count_completed_by_day(user_id, since)` and `get_all_completed_days`
  (GROUP BY `timezone('UTC', completed_at)::date`).
- **Public seam**: `ProfileServiceDep`, `ProfileRepositoryDep` (`dependencies.py`).
- Deps on: `lesson` (models + `lesson_progress` mapper/schemas),
  `user.dependencies` (`UserIdDep`), `core/*`.

### Cross-module dependency summary
```
auth → user, core
user → auth (security/exceptions), core
course → course_member, course/category, media (+media_attachment repos,
         MediaService for covers), user, core     (is_member per viewer; search;
         category filter)
module → course (exceptions/repo), user, core
lesson → course + module (exceptions/repos), user, core
         (lesson_progress reuses LessonServiceDep)
block  → course + lesson (exceptions/repos), media (+media_attachment repos,
         errors), core.storage (Storage), user, core
media  → core.storage (Storage), media_attachment (submodule), user, core
profile → lesson (LessonProgress model + lesson_progress mapper/schemas), user,
          core
submissions → block, course (+course_member), lesson (+lesson_progress),
              user, core
ai     → course (+course_member, enums/exceptions), module (repo/models),
         core.celery_app, core.config, core.redis, user, core
all routers → core.router (app_v1)
```

## 3. Database models & relations

| Table | Model (file) | FKs / unique |
| --- | --- | --- |
| `users` | `User` (`user/models.py`) | username/email unique; is_active; ↔ refresh_tokens |
| `refresh_tokens` | `RefreshToken` (`auth/models.py`) | FK users.id ON DELETE CASCADE |
| `categories` | `Category` (`course/category/models.py`) | slug unique + ix; parent_id self-FK CASCADE; sort_order |
| `courses` | `Course` (`course/models.py`) | FK users.id (owner_id), categories.id (category_id, SET NULL); title/description/cover_url/price/member_count/status; soft delete is_deleted; TGP: tgp_enabled, tgp_last_full_generated_at, tgp_cooldown_hours; pg_trgm GIN ix on title/description |
| `course_members` | `CourseMember` (`course/models.py`) | FK users.id, courses.id; role, left_at; TGP: tgp_last_submitted_at |
| `modules` | `Module` (`module/models.py`) | FK courses.id ON DELETE CASCADE |
| `lessons` | `Lesson` (`lesson/models.py`) | FK modules.id (CASCADE), courses.id |
| `lesson_progress` | `LessonProgress` (`lesson/models.py`) | FK users.id, lessons.id; uq_user_lesson_progress |
| `blocks` | `Block` (`block/models.py`) | FK lessons.id (CASCADE), courses.id; order; payload JSONB |
| `block_submissions` | `BlockSubmission` (`block/models.py`) | FK lessons/blocks/users; submitted_payload JSONB; attempts, is_first_try_correct; uq_user_block_submission |
| `media` | `Media` (`media/models.py`) | FK users.id (owner_id) ON DELETE CASCADE; storage_key, content_type, size_bytes, etag, is_public |
| `media_attachments` | `MediaAttachment` (`media/media_attachment/models.py`) | FK media.id ON DELETE CASCADE; uq_media_attachment (media_id, owner_type, owner_id, role); ix on media_id, owner_id |
| `tgp_questions` | `TgpQuestion` (`ai/models.py`) | FK courses.id, modules.id ON DELETE CASCADE; ix on course_id; options JSONB |

Alembic revision chain (linear, `down_revision` → `revision`):
`719d57e141c5` (base: users/courses/refresh_tokens/modules/lessons/blocks/
block_submissions) → `801e6361c843` (course_id in models) →
`e9bdc2dd629f` (block_type attr) → `d767baa3e278` (lesson_id for blocks) →
`c05cf7919967` (lesson_progress table, block_submissions payload/attempts/
first-try columns, uq) → `e264701752f9` → `cafdbe78a029` (submission_type
renames) → `a4e1ff2972d3` (submission attr rename) → `cf704b7d5f64`
(lesson_progress constraint) → `f547cd198dee` (course_members table,
courses.member_count) → `a1b2c3d4e5f6` (blocks.order, server default 0) →
`0af48c677726` (media table) → `56787d9db8f1` (media_attachments table,
uq_media_attachment, indexes) → `ff5277c7f3ec` (courses.status) →
`c4e309b8d939` (categories table + seed, courses.category_id SET NULL) →
`2146ce932eb4` (expanded ~160-category seed, replaces the initial one) →
`4b7d1c9e2f8a` (pg_trgm extension + GIN indexes on courses.title/description) →
`0fc64b968676` (tgp_questions table; courses.tgp_enabled /
tgp_last_full_generated_at / tgp_cooldown_hours) →
`979626edf2ea` (**HEAD**: course_members.tgp_last_submitted_at).
Run `uv run alembic upgrade head` from `backend/`.

## 4. Frontend (`frontend/src/`)

### Structure
```
app/providers/    AppProviders, React Query, theme, layout (+ theme-context.ts,
                  layout-context.ts — contexts split out for lint-clean React Refresh)
api/client.ts     HTTP bootstrap: VITE_API_URL, auth interceptor (silent refresh;
                  401 → logout only if an access token was present, so anonymous
                  requests never redirect to /login)
client/           GENERATED @hey-api client (sdk.gen.ts, types.gen.ts, schemas.gen.ts,
                  @tanstack/react-query.gen.ts, client.gen.ts) — DO NOT EDIT
components/       ui/ (shadcn) + layout/ (Header, Footer, UserMenu, CategoryCatalog,
                  Layout — mounted by routes/_layout.tsx); NotFoundPage (404 maskot)
features/         auth, dashboard, learner, media, profile, settings, teaching
lib/              utils (cn), toast, errors, dnd (arrayMove, applyOrderToCache,
                  useReorderableList for drag-and-drop reordering), media
                  (validateMediaFile, MEDIA_ALLOWED_TYPES, resolveMediaUrl),
                  tgp (cooldown helpers: getCooldownEnd, getRemainingMs,
                  formatCooldown, useCountdown)
routes/           TanStack Router files + routeTree.gen.ts (generated)
routes.ts         central ROUTES constant (DASHBOARD, LOGIN, SIGNUP, PROFILE,
                  SETTINGS, TEACHING, TEACHING_COURSE, COURSE_DETAIL, LEARN, CATALOG)
styles/           Tailwind v4 CSS design system: tokens.css, semantic.css,
                  global.css, themes/light.css, themes/dark.css
```

### Features → api hooks
| Feature | api/ hooks | pages | main routes |
| --- | --- | --- | --- |
| auth | `useAuth` | LoginPage, SignupPage | `/login`, `/signup` |
| dashboard | `useEnrolledCourses(enabled)`, `useCreatedCourses(limit, enabled)`, `useRecommendedCourses(limit)`, `useCourseCatalog(pageSize)` (infinite), `useCourseDetail(courseId)` (course `filter=current` + modules + per-module lessons), `useCategories`, `useEnrollCourse` | RootPage, CatalogPage (+ CourseCard, CourseRow, CourseRowSection, CourseFilters, ContinueLearningSection, types), CoursePage (public course detail w/ enroll) | `/`, `/catalog`, `/courses/$courseId` |
| learner | `useLearnData` (course filter=current + modules + per-module lessons + blocks + lesson submissions + course progress + `submitBlock` single-step mutation w/ invalidation), `useLearnerTgp` (list questions, submit answers; localStorage-persisted taken/result/lastSubmitted; retake cooldown via `lib/tgp`) | LearnPage (step-by-step: prev/next, LearnSidebar, per-block `blocks/BlockView` variants — Text/Quiz/Media/Code, TgpModals pre-test + result) | `/learn/$courseId`, `/learn/$courseId/$lessonId` |
| profile | `useProfileStats` (→ `GET /users/me/stats`, gated on `isLoggedIn()`) | ProfilePage (streak, weekly/yearly activity, achievements, certificates, "Мои курсы") | `/profile` |
| settings | `useUpdateProfile` (→ `PATCH /users/me`) | SettingsPage (ProfileSettingsForm, PasswordChangePanel, NotificationsPanel, PaymentDetailsPanel, AvatarSettingsSection) | `/settings` |
| teaching | `useCourses`, `useModules`, `useLessons`, `useBlocks` (each exposes `reorderXAsync` + optimistic cache update via `lib/dnd`; `useBlocks` also `uploadBlockMediaAsync`), `useCourseMedia` (course cover upload/remove), `useTgp` (toggle tgp_enabled, generate/regenerate/update/submit questions; optimistic generation cooldown + polling for Celery completion) | TeachingPage, CourseBuilderPage (builder components incl. TgpPanel/TgpQuestionEditor; block-editors/ incl. TipTap-based TextBlockEditor, Image/File/Code/Audio/Video/QuizSingle/QuizMultiple; CourseModulesList/CourseLessonsList/CourseBlocks/BlockItem drag-reorderable; `MediaUploadControl` validates/uploads media files) | `/teaching`, `/teaching/courses/$courseId` |
| media | `useMyMedia`, `useMediaUrl`, `useUploadMedia`, `useDeleteMedia`, `useMedia` (aggregate) | — (api hooks only; wired through teaching `MediaUploadControl`) | — |

Route files: `routes/__root.tsx` (`notFoundComponent: NotFoundPage`),
`routes/_layout.tsx` (Layout shell; redirects logged-out users to `/login` on
non-public routes — `/`, `/catalog`, `/about`, and `/courses/$courseId`
(`ROUTES.COURSE_DETAIL`) stay public),
`_layout/index.tsx` (dashboard), `_layout/catalog.tsx` (catalog),
`_layout/courses.$courseId.tsx` (course detail), `_layout/teaching.index.tsx`,
`_layout/teaching.courses.$courseId.tsx` (course builder),
`_layout/settings.tsx`, `_layout/profile.tsx`,
`_layout/learn.$courseId.tsx` (+ `.index` redirect → first incomplete lesson,
`_layout/learn.$courseId.$lessonId.tsx` step view),
`login.tsx`, `signup.tsx`.

### Client pipeline
```
backend spec (main.py .openapi())
   └─ scripts/generate-client.sh → frontend/openapi.json
       └─ pnpm --filter frontend generate-client (@hey-api/openapi-ts)
           └─ frontend/src/client/**  (byTags → XxxService)
```
Generated services (from `client/index.ts`): `AiTgpService, AuthService,
BlockService, CategorieService, CourseService, DefaultService, LessonService,
LessonsProgresService, MediaService, ModuleService, ProfileService,
SubmissionService, UserService`.

Media in the UI: block editors validate files via `lib/media` +
`MediaUploadControl`, upload through `useBlocks().uploadBlockMediaAsync`; course
cover via `useCourseMedia`; standalone media listing/urls/delete via the
`features/media` hooks (`useMyMedia`/`useMediaUrl`/`useUploadMedia`/
`useDeleteMedia` on the generated `MediaService`).

## 5. Key architecture seams (reused everywhere)

- `core.dependencies.SessionDep / RedisDep / StorageDep / AccessTokenDep`
- `user.dependencies.UserIdDep / OptionalUserIdDep / CurrentUserDep / UserServiceDep`
- `media.dependencies.MediaRepositoryDep / MediaAttachmentRepositoryDep /
  MediaServiceDep` (consumed by `block` and `course`)
- `core.router.app_v1` — single registration point for all feature routers
- Generic CRUD via `core.repositories.BaseRepository` + `core.unit_of_work.BaseUnitOfWork`
- `core.storage.Storage` — pluggable object-storage abstraction (local/S3)
- Celery (`core.celery_app`) + Redis locks for async AI work (`ai/tasks.py`)