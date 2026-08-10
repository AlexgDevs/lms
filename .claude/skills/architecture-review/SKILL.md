---
name: architecture-review
description: Evaluate module boundaries, layering, and coupling across the LMS codebase (FastAPI feature modules + frontend features). Use when planning a new feature, refactoring, moving files, or assessing architecture health.
---

# Architecture Review

Load this skill when planning new features, refactors, moving files, or
evaluating whether the current architecture is sound.

## Process

1. Read `CLAUDE.md`, then `.claude/graph.md` (the current dependency graph).
2. Map the scope of the question onto the graph: which features/modules are
   involved and what do they already depend on?
3. Evaluate:

   - **Layering adherence**: does the considered code cross layers
     (router↔repository, model↔schema) in the wrong direction?
   - **Coupling**: do features depend on each other's internals? Prefer
     `core/*` level deps and small public seams (like `UserIdDep`).
   - **Cohesion**: does the feature group responsibilities that change together?
   - **Duplicate CRUD**: could the work reuse `BaseRepository` /
     `BaseUnitOfWork` / `BaseMapper` instead of new bespoke code?
   - **Frontend**: is the code placed in the right feature (`features/`), or
     should it be shared (`components/`, `lib/`)? Will a backend change require
     regenerating the typed client?

4. Suggest a concrete plan: which files to create/move, what new dependencies
   appear, and where things register (`backend/src/core/router.py`, frontend routes).

5. If the final structure changes the graph, recommend running `/graphify`.

## Output

Summarize with: current state → proposed change → impact on the graph → concrete file list.
