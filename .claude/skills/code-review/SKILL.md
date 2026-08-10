---
name: code-review
description: Review backend (FastAPI/SQLAlchemy async) and frontend (React/TanStack) code in this LMS repo against project conventions. Use when asked to review, critique, or double-check code, or before modifying an existing module.
---

# Code Review

Load this skill whenever the user asks you to review code, check a diff, find
bugs, or validate that new code follows the project's conventions.

## Process

1. Read `CLAUDE.md` and `.claude/graph.md` (if present) for orientation.
2. Identify the module(s) under review and confirm which layer each file belongs to.
3. Run the backend and/or frontend checklist below.
4. Report findings as a prioritized list — `[Critical]`, `[Warn]`, `[Nit]` — each with a `file_path:line` reference.

## Backend checklist

- **Layering**: `router → service → repository/uow → mapper → schemas → models`.
  No business logic in routers; no raw SQL outside repositories; services must
  not reach into other features' repositories directly.
- **Dependency direction**: features import only `core/*` and their own
  submodules; cross-feature imports go through public seams (e.g. `UserIdDep`
  from `user/dependencies.py`), not deep internals.
- **Async**: no blocking DB calls; all DB access via `AsyncSession`; endpoints are `async def`.
- **Types**: mypy strict — no `Any` leaks (except intentional JSONB payloads), no missing return annotations.
- **Schemas**: Pydantic v2 style; request vs response schemas separated; partial updates via `model_dump(exclude_unset=True)`.
- **Errors**: feature-specific exceptions extending `AppException` with a correct
  `status_code`; never raise raw `HTTPException`.
- **Models**: extend `UUIDBase`; UUID PKs; timezone-aware timestamps; sensible FK `ondelete`; named unique constraints.
- **Repo/mapper**: extend `BaseRepository` / `BaseMapper`; don't duplicate generic CRUD.
- **Storage**: file I/O goes through `core.storage.Storage` (`StorageDep`), never direct fs/SDK calls in features.
- **Media attachments**: blocks referencing media must attach/reconcile/detach `MediaAttachment` rows in the same UoW transaction; `delete_media` must reject while `is_referenced`.
- **Migrations**: model/schema changes are accompanied by an Alembic revision.
- **Secrets/logging**: no secrets in logs; loguru used consistently.

## Frontend checklist

- `src/client/**` and `routeTree.gen.ts` are **generated** — flag any manual edits
  (they must be regenerated via `./scripts/generate-client.sh`).
- Data access only through feature hooks in `features/<name>/api/useX.ts`;
  direct `fetch` lives only in `src/api/client.ts`.
- TanStack Query: `enabled` guards for optional ids, query invalidation after
  mutations, loading/error states surfaced.
- Forms: react-hook-form + zod schema in `features/<name>/schemas/`.
- UI: reuse shadcn components from `components/ui/`; no bespoke CSS outside Tailwind utilities.
- Errors surfaced with `getErrorMessage` / `showErrorToast` (`@/lib/errors`, `@/lib/toast`).

## Output

Keep it actionable and concise: file/line, issue, and a concrete suggestion.
