# LMS — Dependency / Module Graph

> Auto-generated orientation file. Refresh with `/graphify` after structural
> changes. Generated: 2026-08-10 (refreshed by agent scan). Convention: `A → B`
> means "A imports/depends on B".

## 1. Backend — core infrastructure (`backend/src/core/`)

No business logic. Everything below is shared infrastructure.

| Path | Purpose |
| --- | --- |
| `core/config.py` | pydantic-settings: `PostgresSettings`, `AppSettings`, `RedisSettings`, `StorageSettings`, `MediaSettings`, root `settings` |
| `main.py` (`src/main.py`, entry) | FastAPI app factory, lifespan (redis + storage init/close), CORS, static `/media` mount (local backend), error handler registration |
| `core/router.py` | `app_v1` — registers ALL feature routers (`/api/v1` prefix) |
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
  `POST /{course_id}/members` (enroll), `POST /{course_id}/media` (upload cover,
  multipart `file` + `is_public` → `CourseSchema`), `DELETE /{course_id}/media`
  (remove cover, 204).
- Models: `Course` (owner_id→users, title, description, cover_url, price,
  member_count, is_deleted), `CourseMember` (user_id, course_id, role, left_at).
- Enums: `CourseMemberRole` (member/teacher/so_owner).
- Media cover: `cover_url` is a server-generated public storage URL. Upload
  attaches a `MediaAttachment(owner_type=course, role=cover)` and replaces the
  previous cover (old media purged after commit if unreferenced); remove detaches
  and purges. `CourseUnitOfWork` now composes `media` + `media_attachments` repos;
  `CourseServiceDep` injects `MediaServiceDep`.
- **Public seam**: `CourseServiceDep` (`dependencies.py`).
- Deps on: `course_member` (submodule), `media` (+`media_attachment` repos,
  `MediaService`), `user.dependencies` (`UserIdDep`), `core/*`.

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
  `PATCH /{block_id}`, `DELETE /{block_id}`, `GET ""` (`only_created` → owner path),
  `POST /{block_id}/media` (multipart upload → `BlockSchema`; only for media block
  types).
- Model: `Block` (lesson_id→lessons, course_id, title, `block_type`, `order`,
  `payload` JSONB). `BlockSubmission` (lesson_id, block_id, user_id,
  submission_type, submitted_payload, attempts, is_first_try_correct; unique
  uq_user_block_submission).
- Media: media block types (`IMAGE/VIDEO/AUDIO/FILE`) carry `media_id` in
  `payload` (cache); `BlockService` validates ownership, **attaches** a
  `MediaAttachment` on create, **reconciles** (detach-all + re-attach) on update,
  **detaches** on delete, and on every read **resolves `payload.url` from the
  block's `MediaAttachment` rows** (attachment is authoritative, not the payload
  cache): public → storage URL, private → presigned URL. `POST /{block_id}/media`
  uploads + attaches (old media purged after commit if unreferenced); non-media
  block types → `BlockTypeNotMediaError` (422). `BlockUnitOfWork` composes
  `media` + `media_attachments` repos; `BlockServiceDep` injects `MediaServiceDep`
  + `StorageDep`.
- Content schemas: `ImageBlockContent`, `VideoBlockContent`, `AudioBlockContent`,
  `FileBlockContent` all have optional `url` + `media_id` (+ type-specific fields).
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

### Cross-module dependency summary
```
auth → user, core
user → auth (security/exceptions), core
course → course_member, media (+media_attachment repos, MediaService for covers),
         user, core
module → course (exceptions/repo), user, core
lesson → course + module (exceptions/repos), user, core
        (lesson_progress reuses LessonServiceDep)
block  → course + lesson (exceptions/repos), media (+media_attachment repos,
         errors), core.storage (Storage), user, core
media  → core.storage (Storage), media_attachment (submodule), user, core
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
| `media` | `Media` (`media/models.py`) | FK users.id (owner_id) ON DELETE CASCADE; storage_key, content_type, size_bytes, etag, is_public |
| `media_attachments` | `MediaAttachment` (`media/media_attachment/models.py`) | FK media.id ON DELETE CASCADE; uq_media_attachment (media_id, owner_type, owner_id, role); ix on media_id, owner_id |

Alembic revision chain (linear, `down_revision` → `revision`):
`719d57e141c5` (base: users/courses/refresh_tokens/modules/lessons/blocks/
block_submissions) → `801e6361c843` (course_id in models) →
`e9bdc2dd629f` (block_type attr) → `d767baa3e278` (lesson_id for blocks) →
`c05cf7919967` (lesson_progress table, block_submissions payload/attempts/
first-try columns, uq) → `e264701752f9` → `cafdbe78a029` (submission_type
renames) → `a4e1ff2972d3` (submission attr rename) → `cf704b7d5f64`
(lesson_progress constraint) → `f547cd198dee` (course_members table,
courses.member_count) → `a1b2c3d4e5f6` (blocks.order, server default 0) →
`0af48c677726` (media table) → `56787d9db8f1` (**HEAD**: media_attachments
table, uq_media_attachment, indexes). Run `uv run alembic upgrade head` from `backend/`.

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
| teaching | `useCourses`, `useModules`, `useLessons`, `useBlocks` (each exposes `reorderXAsync` + optimistic cache update via `lib/dnd`) | TeachingPage, CourseBuilderPage (builder components + block-editors/ incl. Image/File/Code/Audio/Video/QuizSingle/QuizMultiple; CourseModulesList/CourseLessonsList/CourseBlocks/BlockItem are drag-reorderable) | `/teaching`, `/teaching/courses/$courseId` |

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
MediaService, ModuleService, SubmissionService, UserService`.

Media in the UI: uploads go through the generated `MediaService`
(`uploadMediaApiV1MediaPost`, `getMediaUrlApiV1MediaMediaIdUrlGet`, etc.) and the
course/block media endpoints via `CourseService`/`BlockService`.

## 5. Key architecture seams (reused everywhere)

- `core.dependencies.SessionDep / RedisDep / StorageDep / AccessTokenDep`
- `user.dependencies.UserIdDep / CurrentUserDep / UserServiceDep`
- `media.dependencies.MediaRepositoryDep / MediaAttachmentRepositoryDep /
  MediaServiceDep` (consumed by `block` and `course`)
- `core.router.app_v1` — single registration point for all feature routers
- Generic CRUD via `core.repositories.BaseRepository` + `core.unit_of_work.BaseUnitOfWork`
- `core.storage.Storage` — pluggable object-storage abstraction (local/S3)
