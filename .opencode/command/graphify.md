---
description: Scan the repo, rebuild the module/dependency graph, and refresh .claude/ context files.
agent: build
---

Scan this project and refresh its context system. Work through the steps below,
using read-only tools (glob/grep/read) to inspect and write/edit to update files.

## Steps

1. **Scan the tree**
   - Backend: all files under `backend/src/` (glob `backend/src/**/*.py`, skip `__pycache__`).
   - Frontend: all source under `frontend/src/` EXCEPT the generated
     `frontend/src/client/**` (note only the entry `src/client/index.ts`).
   - Migrations: `alembic/versions/*.py` (note model/table changes in recent revisions).
   - Config: `pyproject.toml`, `frontend/openapi-ts.config.ts`,
     `backend/src/core/router.py`, `docker-compose.yaml`.

2. **Rebuild the graph** into `.claude/graph.md`
   - Backend feature modules: for each feature, list its files and the layer
     chain `router → service → repository/uow → mapper → schemas → models`
     (plus `enums.py`, `exceptions.py`, `dependencies.py`).
   - Cross-module dependencies (e.g. `course → course_member`,
     `lesson → lesson_progress`, who consumes `UserIdDep`, which routers exist).
   - Database models & relations (tables → FKs → unique constraints) and which
     Alembic revision introduced them.
   - Frontend: features with their `api/` hooks, pages, routes (from
     `src/routes/`), and the client pipeline (openapi.json → generated client).
   - Router registration map (`core/router.py`) and the OpenAPI tag → service mapping.

3. **Diff** the new graph against the current `.claude/graph.md`. Note added or
   removed modules, renamed layers, new models, new routes, changed dependencies.

4. **Refresh context files** (only if structure actually changed):
   - Update `CLAUDE.md` sections that are stale (module list, repo tree, key
     paths, commands).
   - Update `.claude/skills/*/SKILL.md` and `.opencode/agents/*.md` ONLY if
     their scope or mentions became inaccurate.

5. **Report** a concise summary: what changed in the codebase, what was updated,
   and what's new in the graph.

If `$ARGUMENTS` contains a focus (e.g. a feature name), scan that area in depth
and update only the relevant parts of the graph.
