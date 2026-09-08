# LMS — Dependency / Module Graph

> Auto-generated orientation file. Refresh with `/graphify` after structural
> changes. Generated: 2026-08-29 (rescanned by agent scan). Convention: `A → B`
> means "A imports/depends on B".

## 1. Backend — core infrastructure (`backend/src/core/`)

No business logic. Everything below is shared infrastructure.

| Path | Purpose |
| --- | --- |
| `config.py` | pydantic-settings: `PostgresSettings`, `AppSettings`, `RedisSettings`, `StorageSettings`, `MediaSettings`, `AIGatewaySettings`, `TgpSettings`, `AssistantSettings`, `CourseReviewSettings`, `CourseGenerateSettings`, `CodeExecSettings`, `PaymentSettings`, `MailSettings`, root `settings`. `ENV_FILE_PATH = backend/.env`. |
| `main.py` | FastAPI app factory + lifespan (redis + storage + `InMemoryEvent` + `ConnectionManager` + `NotificationHandler`), CORS, static `/media` (local backend), error handler registration, `/hello`. |
| `core/router.py` | `app_v1` (prefix `settings.app.API_V1_STR`) — registers ALL feature routers + a separate `notifications_router` (added in `main.py`). |
| `core/celery_app.py` | Celery app (Redis broker; `ai.tgp.*`, `ai.course_review.*`, `ai.generate.*` tasks; `worker_pool="solo"` for Windows dev). |
| `core/dependencies.py` | `SessionDep`, `RedisDep`, `StorageDep`, `AccessTokenDep`, `EventBusDep`, `reusable_oauth2`. |
| `core/events/` | `event.py` (all `DomainEvent` classes: UserLoggedIn/Out, BlockDeleted, CourseDeleted, Course* , LessonDeleted, ModuleDeleted, CourseReview*, MemberRoleChanged), `protocol.py` (`Event` Protocol + `InMemoryEvent` bus), `adapter.py`. |
| `core/handlers/` | error handler → `{error, detail}` (via `AppException`). |
| `core/logging/` | loguru `setup_logging`. |
| `core/mailer/` | `mailer.py` — SMPT send via `aiosmtplib` (fail-soft), `send_verification_email`, `send_password_reset_email`, link builders using `FRONTEND_HOST`. |
| `core/mappers/` | `BaseMapper[ORM, Schema]`. |
| `core/postgres/` | engine (asyncpg), session, `Base`/`UUIDBase`, `uuid_pk`/`int_pk`/`str_128`/`created_at`/`timestamp` types, `UUIDMixin`. |
| `core/realtime/` | `envelope.py` — `Envelope` + `EventType(StrEnum)` for WS push. |
| `core/repositories/` | `BaseRepository[T, R]` — generic CRUD (`get_filtered`/`get_one`/`create`/`update`/`delete`). |
| `core/redis/` | asyncio redis `init_redis`/`close_redis`. |
| `core/schemas/` | `BaseSchema` (from_attributes=True), `PolymorphicPayloadMixin`. |
| `core/services/` | `BaseService` (holds `session`, optional `event_bus`). |
| `core/storage/` | `Storage` Protocol + `LocalStorage`/`S3Storage` via `@register_storage` factory registry (`STORAGE_BACKEND`); `StorageError`/`StorageObjectNotFoundError`. |
| `core/unit_of_work/` | `BaseUnitOfWork` — async ctx manager, `commit`/`rollback`. |
| `core/websocket/` | `auth.py` (`get_current_user_id_ws`, `UserIdWSDep`), `connection.py` (`Connection`), `manager.py` (`ConnectionManager`). |
| `core/utils.py` | `parse_cors` (CORS origins). |

Feature modules depend on `core/*`; `core/*` never depends on features.

Note: `notifications_router` is intentionally **not** part of `app_v1`; it is
included separately in `main.py` because it also declares a WebSocket route.

## 2. Backend — feature modules (`backend/src/<feature>/`)

### Dependency direction
```
router → service → repository / unit_of_work → mapper → schemas → models
```
Plus `enums.py`, `exceptions.py`, `dependencies.py` per feature. New routers
register in `backend/src/core/router.py`.

### auth (`src/auth/`)
Files: `router, services, security, schemas, models, repository, unit_of_work,
mapper, exceptions, dependencies, device_parser, utils`.
- Router prefix `/auth` tags `["Auth"]`.
- **Public**: `POST /register` (201 → `UserPublicSchema` + Location), `POST /login`
  (OAuth2 form → `TokenPair`), `POST /refresh` (rotation), `POST /forgot-password`,
  `POST /reset-password`, `POST /verify-email`, `POST /resend-verification`.
- **Auth-only (no email verification required)**: `POST /logout` (204),
  `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `DELETE /auth/sessions`.
- Model: `RefreshToken` (FK `users.id` CASCADE, token_hash, is_revoked,
  expires_at, ip_address, user_agent, device_name).
- `security.py`: Argon2 hash/verify, JWT access (15 min), opaque refresh token
  (SHA-256 stored), reset token (15 min, `type="reset"`), verification token
  (24 h, `type="verify"`).
- `device_parser.py`: User-Agent → "Chrome on Windows".
- Deps: `user.repository`, `core/*`. Public seam: `AuthServiceDep`.

### user (`src/user/`)
Files: `router, service, repository, mappers, schemas, models, exceptions, dependencies`.
- Router prefix `/users` tags `["Users"]`: `GET /me` (auth-only), `GET /me/ai-generations`
  (**verified**), `PATCH /me` (auth-only), `GET /{user_id}` (auth-only → `UserPublicSchema`),
  `POST /me/password` (auth-only).
- Model: `User` (username/email unique, password_hash, avatar_url, joined_at,
  is_active, is_staff, ai_course_generations, is_verified, email_verified_at).
- **Public seams + verification gate** (`dependencies.py`):
  `UserIdDep`, `CurrentUserDep`, `StaffDep` **require email verification**
  (raise `UserNotVerifiedError`, 403); `OptionalUserIdDep` = anonymous/public;
  `AuthenticatedUserIdDep` / `AuthenticatedCurrentUserDep` = auth-only (no verify).
- Deps: `auth.security`/`auth.exceptions` (token decode), `core/*`.

### course (`src/course/`) + `course/course_member` + `course/category` + `course/analytics`
Files (course): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, enums, dependencies`.
Files (course_member): `schemas, service, repository, mappers, unit_of_work`.
Files (category): `router, service, repository, mapper, schemas, models, dependencies`.
Files (analytics): `router, schemas, service` (`CourseAnalyticsService`).
- Router prefix `/courses` tags `["Courses"]`, `["Categories"]`,
  `["Course Analytics"]`.
- **Course CRUD (verified)**: `POST ""`, `PATCH /{id}` (owner may only set
  `status=draft`), `DELETE /{id}`, `POST /{id}/submit` (completeness check →
  Celery `ai.course_review.review`), `POST /generate` (AI course structure),
  `POST /{id}/members` (enroll), `DELETE /{id}/members/me` (unenroll),
  `POST/DELETE /{id}/media` (cover via `MediaService`).
- **Moderation (staff)**: `GET /moderation/queue`, `POST /{id}/moderation/approve|reject`.
- **Public read**: `GET ""` (filter=all, public; filter=my/created — optional auth),
  `GET /{id}` (filter=current, public; author/my — auth). `CourseSchema.is_member`
  + `owner_username` resolved per viewer; search `q` (pg_trgm) + `category=<slug>`
  (parent + children); `certificate_enabled`, `price`, `sort`, `min_rating`.
- **Analytics (owner)**: `GET /{id}/analytics`, `/analytics/enrollments`,
  `/analytics/content`.
- Models: `Course` (owner_id, title, description, cover_url, price, category_id,
  member_count, status, moderation_reason, tgp_*, certificate_enabled, soft delete),
  `CourseMember` (user_id, course_id, role, left_at, tgp_last_submitted_at),
  `Category` (name, slug, icon, parent_id, sort_order).
- Enums: `CourseMemberRole`, `CourseStatus`.
- Deps: `course_member`, `course/category`, `course/analytics`, `media`
  (+`media_attachment`), `user.dependencies`, `core.*`.

### module (`src/module/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, models, exceptions, dependencies`.
- Router prefix `/courses/{course_id}/modules` tags `["Modules"]`: `POST ""`,
  `PATCH /reorder`, `PATCH /{module_id}`, `DELETE /{module_id}`, `GET ""`
  (`only_created` → owner; else member/public for published).
- Model: `Module` (course_id CASCADE, title, description, order).
- Deps: `course` (enums/exceptions/repo), `user.dependencies`, `core.*`.

### lesson (`src/lesson/`) + `lesson/lesson_progress`
Files (lesson): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, enums, dependencies`.
Files (lesson_progress): `router, schemas, repository, mapper, dependencies`.
- Router prefix `/courses/{course_id}/modules/{module_id}/lessons` tags `["Lessons"]`:
  `POST ""`, `PATCH /reorder`, `PATCH /{lesson_id}`, `DELETE /{lesson_id}`, `GET ""`
  (only_created → owner; else member/public for published).
- Progress routers tags `["Lessons Progress"]`: `POST /lessons/{lesson_id}/progress`,
  `GET /courses/{course_id}/progress`.
- Models: `Lesson` (module_id, course_id, title, order), `LessonProgress`
  (user_id, lesson_id, status, completed_at; uq_user_lesson_progress).
- Enums: `LessonProgressType`.
- Deps: `course` + `module` (exceptions/repos), `user.dependencies`, `core.*`.

### block (`src/block/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, models,
exceptions, enums, dependencies`.
- Router prefix `/courses/{course_id}/lessons/{lesson_id}/blocks` tags `["Blocks"]`:
  `POST ""`, `PATCH /reorder`, `PATCH /{block_id}`, `DELETE /{block_id}`,
  `POST /{block_id}/media`, `GET ""` (only_created → owner; else **member** only).
- Model: `Block` (lesson_id CASCADE, course_id, title, block_type, order, payload JSONB),
  `BlockSubmission` (lesson_id, block_id, user_id, submission_type,
  submitted_payload, attempts, is_first_try_correct; uq_user_block_submission).
- Text (TipTap `html`, nh3-sanitized), media blocks bind/reconcile/detach
  `MediaAttachment` and resolve `payload.url` on read; quiz answers stripped on
  member read (`_strip_quiz_answers`).
- Enums: `BlockType` (text/quiz_single_choice/quiz_multiple_choice/code/image/
  video/audio/file), `BlockSubmissionType`.
- Deps: `course` + `lesson`, `media` (+`media_attachment`), `user.dependencies`,
  `core.storage`, `core.*`.

### submissions (`src/submissions/`)
Files: `router, service, unit_of_work, repository, mapper, schemas, exceptions, dependencies, checker`.
- Route tags `["Submissions"]` under `/courses/{course_id}/lessons/{lesson_id}`:
  batch `POST /submissions`, single-step `POST /blocks/{block_id}/submission`,
  `GET /submissions`.
- `checker.py`: `BlockChecker` registry (quiz multiple/choice, code via `codeexec`).
- `BlockSubmissionUnitOfWork` composes: submissions, blocks, lessons,
  lessons_progress, courses, course_members.
- Deps: `block`, `course` (+course_member), `lesson`, `user.dependencies`,
  `codeexec`, `core.*`.

### codeexec (`src/codeexec/`)
Files: `service, exceptions` (+ `__init__`). Piston (engine-manager) HTTP client
(`/api/v2/execute`), language aliases python/javascript/typescript/go, per-case
timeouts/memory from `CodeExecSettings`. No DB tables or routes. Used by the CODE
`BlockChecker`. Requires Piston at `CODEEXEC_BASE_URL` (compose profile `codeexec`).

### media (`src/media/`) + `media/media_attachment`
Files (media): `router, service, unit_of_work, repository, mapper, schemas,
models, exceptions, dependencies`.
Files (media_attachment): `models, schemas, mappers, repository, exceptions, enums`.
- Route prefix `/media` tags `["Media"]` — **auth-only** (own media): `POST ""`,
  `GET ""`, `GET /{media_id}`, `GET /{media_id}/url`, `DELETE /{media_id}`.
- Model: `Media` (owner_id CASCADE, storage_key, content_type, size_bytes, etag,
  is_public), `MediaAttachment` (media_id CASCADE, owner_type, owner_id, role,
  position; uq_media_attachment).
- Enums: `MediaAttachmentRole`, `MediaOwnerType`.
- Public seam: `MediaServiceDep`, `MediaRepositoryDep`, `MediaAttachmentRepositoryDep`.
- Deps: `core.storage`, `media_attachment`, `user.dependencies`, `core.*`.

### profile (`src/profile/`)
Files: `router, service, schemas, repository, dependencies`. Read-only stats
(`GET /users/me/stats`, auth-only); reuses `LessonProgress` (no own tables).
Deps: `lesson` (+lesson_progress mapper/schemas), `user.dependencies`, `core.*`.

### certificate (`src/certificate/`)
Files: `router, service, schemas, models, repository, unit_of_work, mapper,
exceptions, dependencies, pdf_generator`.
- Routes tags `["Certificates"]`: `GET /courses/{id}/certificate` (download PDF,
  lazy generation) and `GET /users/me/certificates` (list) — **auth-only**.
- Model: `Certificate` (user_id CASCADE, course_id CASCADE,
  certificate_number, storage_key, issued_at; uq_user_course_certificate).
- Uses reportlab (`pdf_generator.py`); PDF stored via storage backend.
- Deps: `course`, `user.dependencies`, `core.storage`, `core.*`.

### review (`src/review/`)
Files: `router, service, schemas, models, repository, mapper, exceptions, enums,
dependencies, unit_of_work`.
- Route prefix `/reviews` tags `["Reviews"]`: `POST ""` (root review or reply,
  verified), `GET /{target_type}/{target_id}` (public/optional auth),
  `GET /{target_type}/{target_id}/rating` (aggregate).
- Model: `Review` — polymorphic (target_type: course|user|lesson, target_id),
  root reviews carry `rating` 1..5, replies have `parent_id`; partial unique
  index `uq_review_user_target` (one root review per user×target).
- Enums: `ReviewTargetType` (COURSE/USER/LESSON).
- Deps: `course`, `user.dependencies`, `core.*`.

### payment (`src/payment/`)
Files: `router, service, schemas, models, repository, unit_of_work, mapper,
exceptions, enums, dependencies, security, client`.
- Route prefix `/payments` tags `["Payments"]`: `POST /courses/{id}/checkout`
  (verified), `POST /webhook/yookassa` (IP allow-listed), `GET /me` (auth-only),
  `GET /courses/{id}/payment` (auth-only), `GET /config`, `GET/PUT/DELETE /payout-account`
  (auth-only).
- `security.py`: trusted YooKassa IP check; `client.py`: YooKassa SBP client.
- Models: `Payment` (user_id, course_id, kind, amount, currency, status, provider,
  provider_payment_id, meta, platform_fee, author_amount, payout_status, paid_at;
  uq_payment_provider_payment_id), `PayoutAccount` (user_id unique, method,
  recipient, holder_name, bank_name, is_active).
- Enums: `PaymentStatus`, `PaymentKind`, `PaymentProvider`, `PayoutMethod`, `PayoutStatus`.
- Deps: `course` (+course_member), `user.dependencies`, `core.*`. Webhook
  enrolls the user on `payment.succeeded`.

### notification (`src/notification/`)
Files: `router, service, schemas, models, repository, mapper, dependencies, handler`.
- Route tags `["Notifications"]` (registered via a separate `notifications_router`):
  `GET /notifications`, `GET /notifications/unread-count`,
  `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` — **auth-only**;
  `WS /ws/notifications`.
- Model: `Notification` (user_id CASCADE, type, title, body, link, is_read).
- `handler.py`: `NotificationHandler` subscribes to `core.events` domain events
  (`EVENT_MAP`) on a fresh session + pushes via `ConnectionManager`.
- Deps: `auth.security` (decode token), `user.dependencies`, `core.websocket`,
  `core.events`, `core.realtime`.

### ai (`src/ai/`) — shared client + four features
Shared: `gemini.py` (`GeminiService` — OpenAI-compatible chat client),
`exceptions.py` (`AiError`/`AiNotConfiguredError`/`AiRateLimitError`/`AiUnavailableError`).
- `ai/tgp` — The Golden Path pre-course testing. Route `/ai/tgp` tags `["AI TGP"]`:
  list/generate/regenerate/update/submit questions. Model `TgpQuestion`
  (course_id, module_id, question_text, options JSONB, correct_option). Celery
  task gen + Redis lock. Enums: `TgpDecision`.
- `ai/assistant` — inline learner assistant. Route `/ai/assistant` tags
  `["AI Assistant"]`: hint, streaming `ask` (SSE), regenerate; Redis cooldowns +
  rate limits + cached "ladder". Enums moved to `ai/assistant/enums.py`
  (`AssistantFocus`, `AssistantAngle`, `AssistantAction`).
- `ai/course_review` — moderation pre-screen. Celery task `ai.course_review.review`
  (Redis lock, retries, heuristic fallback) → `GeminiService.review_course`;
  AI approve → auto-publish, flagged → stays `under_review`.
- `ai/generate` — AI course-structure generator. Celery task
  `ai.generate.course_generate_task`; schemas (`ModulesResponseSchema`,
  `LessonsResponseSchema`, `LessonPlanResponseSchema`, `Batch*`) + prompt
  templates in `src/ai/prompts/generate/` (loader `src/ai/prompts/loader.py`).
- Deps: `course`, `module`, `block`, `lesson`, `user.dependencies`,
  `core.celery_app`, `core.config`, `core.redis`, `core.*`.

### Cross-module dependency summary
```
auth → user(repository), core
user → auth(security/exceptions), core
course → course_member, course/category, course/analytics, media(+media_attachment,
        MediaService), user, core        (public read; search; category filter)
module → course(exceptions/repo), user, core
lesson → course + module(exceptions/repos), user, core
block  → course + lesson(exceptions/repos), media(+media_attachment), core.storage,
         user, core
submissions → block, course(+course_member), lesson(+lesson_progress), codeexec,
              user, core
media → core.storage, media_attachment(submodule), user, core
profile → lesson(LessonProgress + lesson_progress), user, core
certificate → course, user, core.storage, core(reportlab)
review → course, user, core
payment → course(+course_member), user, core
notification → auth(security), user, core.websocket, core.events, core.realtime
ai → course(+course_member), module, block, lesson, core.celery_app, core.config,
     core.redis, user, core
all routers → core.router (app_v1) + notification via notifications_router
```

## 3. Database models & relations

| Table | Model (file) | FKs / unique | Revision |
| --- | --- | --- | --- |
| `users` | `User` (`user/models.py`) | username/email unique | base |
| `refresh_tokens` | `RefreshToken` (`auth/models.py`) | FK users.id CASCADE; ip_address/user_agent/device_name | `a3b4c5d6e7f8` (session metadata) |
| `categories` | `Category` (`course/category/models.py`) | slug unique; parent_id self-FK; sort_order | `c4e309b8d939`/`2146ce932eb4` |
| `courses` | `Course` (`course/models.py`) | FK users.id, categories.id SET NULL; pg_trgm GIN ix (title/description); is_deleted soft delete | `ff5277c7f3ec` (status), `ce85a29c77ab` (moderation_reason), `b2c3d4e50001` (certificate_enabled), `0fc64b968676` (tgp_*) |
| `course_members` | `CourseMember` (`course/models.py`) | FK users.id, course_id; role, left_at, tgp_last_submitted_at | `f547cd198dee` / `979626edf2ea` |
| `modules` | `Module` (`module/models.py`) | FK courses.id CASCADE | base |
| `lessons` | `Lesson` (`lesson/models.py`) | FK modules.id CASCADE, courses.id | base |
| `lesson_progress` | `LessonProgress` (`lesson/models.py`) | FK users.id, lessons.id; uq_user_lesson_progress | `c05cf7919967`/`cf704b7d5f64` |
| `blocks` | `Block` (`block/models.py`) | FK lessons.id CASCADE, courses.id; order; payload JSONB | `801e6361c843`/`a1b2c3d4e5f6` |
| `block_submissions` | `BlockSubmission` (`block/models.py`) | FK lessons/blocks/users; uq_user_block_submission | `a4e1ff2972d3`/`cafdbe78a029` |
| `media` | `Media` (`media/models.py`) | FK users.id CASCADE; storage_key, content_type, size_bytes, etag, is_public | `0af48c677726` |
| `media_attachments` | `MediaAttachment` (`media/media_attachment/models.py`) | FK media.id CASCADE; uq_media_attachment; ix media_id, owner_id | `56787d9db8f1` |
| `tgp_questions` | `TgpQuestion` (`ai/models.py`) | FK courses.id, modules.id CASCADE; ix course_id | `0fc64b968676` |
| `certificates` | `Certificate` (`certificate/models.py`) | FK users.id CASCADE, courses.id CASCADE; uq_user_course_certificate | `a1b2c3d40001` |
| `reviews` | `Review` (`review/models.py`) | FK users.id CASCADE, parent_id self-FK; ix (target_type,target_id); partial uq_review_user_target | `c4d5e6f70001` |
| `payments` | `Payment` (`payment/models.py`) | FK users.id CASCADE, course_id; uq_payment_provider_payment_id | `d5e6f7a80001` / `f9a8b7c6e5d4` (kind) |
| `payout_accounts` | `PayoutAccount` (`payment/models.py`) | FK users.id CASCADE, unique user_id | `e6f7a8b90001` |
| `notifications` | `Notification` (`notification/models.py`) | FK users.id CASCADE, ix user_id/type | `769824c82bee` |

User columns added: `is_staff` + `ai_course_generations` (from `ce85a29c77ab`,
`a2b3c4d5e6f0`), `is_verified` + `email_verified_at` (from `b3c4d5e6f7a1`).

### Alembic revision chain
Linear master: `719d57e141c5` (base) → `801e6361c843` → `e9bdc2dd629f` →
`d767baa3e278` → `c05cf7919967` → `e264701752f9` → `cafdbe78a029` →
`a4e1ff2972d3` → `cf704b7d5f64` → `f547cd198dee` → `a1b2c3d4e5f6` →
`0af48c677726` → `56787d9db8f1` → `ff5277c7f3ec` → `c4e309b8d939` →
`2146ce932eb4` → `4b7d1c9e2f8a` → `0fc64b968676` → `979626edf2ea`.

`979626edf2ea` previously branched into **three heads**, now reconciled by a
single merge revision `ce4bb5db3513` (`down_revision` = the three tips
`b3c4d5e6f7a1`, `769824c82bee`, `a3b4c5d6e7f8`):
- `a1b2c3d40001` → `b2c3d4e50001` → `c4d5e6f70001` → `d5e6f7a80001` →
  `e6f7a8b90001` → `f9a8b7c6e5d4` → `a2b3c4d5e6f0` → `b3c4d5e6f7a1`;
- `ce85a29c77ab` → `769824c82bee`;
- `a3b4c5d6e7f8`.

**HEAD = `ce4bb5db3513`.** `alembic upgrade head` runs fine. Run alembic from the
repo root (`alembic.ini` + `alembic/` live here; `env.py` imports model metadata).

## 4. Frontend (`frontend/src/`)

### Structure
```
app/providers/    AppProviders, React Query, theme(+context), layout(+context),
                  useLayout, useTheme
api/client.ts     HTTP bootstrap: VITE_API_URL, silent-refresh interceptor,
                  401 → logout; 403 UserNotVerifiedError → /verify-email
api/errors.ts     ApiError
client/           GENERATED @hey-api client (sdk, types, schemas,
                  @tanstack/react-query, client) — DO NOT EDIT
components/       ui/ (shadcn) + layout/ (Header, Footer, UserMenu,
                  CategoryCatalog, MobileNav, Layout, EmailVerificationBanner)
                  + NotFoundPage
features/         admin, auth, certificate, dashboard, learner, media,
                  notification, payment, profile, review, settings, teaching
lib/              utils(cn), toast, errors, dnd, media, tgp(cooldowns),
                  assistant, irbisSprite
routes/           TanStack Router files + routeTree.gen.ts (generated)
routes.ts         central ROUTES constant
styles/           tokens.css, semantic.css, global.css, themes/{light,dark}.css
```

### Features → api hooks → routes
| Feature | api/ | pages | routes |
| --- | --- | --- | --- |
| auth | `useAuth` | LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage | `/login`,`/signup`,`/forgot-password`,`/reset-password`,`/verify-email` |
| dashboard | `useCourses` (enrolled/created/recommended/catalog/enroll/unenroll), `useCourseDetail`, `useCategories` | RootPage, CatalogPage, CoursePage | `/`, `/catalog`, `/courses/$courseId` (public) |
| learner | `useLearnData`, `useTgp`, `useAssistant` | LearnPage, LearnRedirectPage | `/learn/$courseId`, `/learn/$courseId/$lessonId` |
| teaching | `useCourses`, `useModules`, `useLessons`, `useBlocks`, `useCourseMedia`, `useCourseAnalytics`, `useCourseGenerate`, `useTgp` | TeachingPage, CourseBuilderPage, CourseAnalyticsPage | `/teaching`, `/teaching/courses/$courseId`, `/teaching/courses/$courseId/analytics` |
| profile | `useProfileStats` | ProfilePage | `/profile`, `/profile/payments` |
| settings | `useSettings`, `useSessions` | SettingsPage | `/settings` |
| media | `useMedia` (list/url/upload/delete) | — | — |
| payment | `usePayments`, `usePayoutAccount` | PaymentHistoryPage, MockPaymentPage | `/mock-payment` |
| review | `useReviews` | (components on CoursePage/Profile) | — |
| certificate | `useMyCertificates`, `useDownloadCertificate` | (CertificatesModal on Profile) | — |
| notifications | `useNotifications`, `useNotificationSocket` | NotificationsBell + NotificationsPanel | `/ws/notifications` |
| admin | `useModeration` | ModerationPage | `/admin/moderation` |

Routes files: `__root`, `_layout` (Logged-in shell; public routes stay
`/`, `/catalog`, `/courses/$courseId`), `_layout/index|settings|profile|profile/index|
profile/payments|catalog|courses.$courseId|teaching*|learn*|admin.moderation`,
and standalone `login|signup|forgot-password|reset-password|verify-email|mock-payment`.

### Client pipeline
```
backend spec (main.py .openapi())
   └─ scripts/generate-client.sh → frontend/openapi.json
       └─ pnpm --filter frontend generate-client (@hey-api/openapi-ts, byTags)
           └─ frontend/src/client/**
```
Generated services (from `client/index.ts`): `AiAssistantService, AiTgpService,
AuthService, BlockService, CategorieService, CertificateService,
CourseAnalyticService, CourseService, DefaultService, LessonService,
LessonsProgresService, MediaService, ModuleService, NotificationService,
PaymentService, ProfileService, ReviewService, SubmissionService, UserService`.

Media in the UI: block editors validate via `lib/media` + `MediaUploadControl`,
upload through `useBlocks().uploadBlockMediaAsync`; course cover via
`useCourseMedia`; standalone media via `features/media` hooks.

## 5. Key architecture seams (reused everywhere)

- `core.dependencies.SessionDep / RedisDep / StorageDep / AccessTokenDep / EventBusDep`
- `user.dependencies.UserIdDep / AuthenticatedUserIdDep / CurrentUserDep /
  StaffDep / OptionalUserIdDep` — verification-aware (see §2 `user`)
- `media.dependencies.MediaRepositoryDep / MediaAttachmentRepositoryDep /
  MediaServiceDep` (consumed by `block` and `course`)
- `core.router.app_v1` — single registration point for all feature routers;
  `main.py` also includes `notifications_router` (WS)
- Generic CRUD via `core.repositories.BaseRepository` + `core.unit_of_work.BaseUnitOfWork`
- `core.storage.Storage` — pluggable object-storage abstraction (local/S3)
- `core.events.Event` (InMemory bus) + `core.websocket.ConnectionManager` for
  domain-event → realtime notification push
- Celery (`core.celery_app`) + Redis locks for async AI work (`ai/tasks.py`,
  `ai/{tgp,generate,course_review}/tasks.py`)
