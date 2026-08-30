<div align="center">
  <img src="frontend/public/full-logo.png" width="400" alt="LMS Logo" />
  <br />
  <br />

  [![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
</div>

<br />

<div align="center">
  <strong>AI-first Learning Management System</strong>
  <br />
  Students get personalized learning paths. Authors build courses with AI copilot.
  <br />
  <br />
</div>

---

<details>
<summary><strong>Table of Contents</strong></summary>

- [What is this](#what-is-this)
- [Features](#-features)
- [Stack](#-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

</details>

---

## What is this

A modern, AI-first **Learning Management System** built as a monorepo. Students enroll in courses, complete lessons with text/quiz/code blocks, and receive AI-powered personalized learning paths. Authors build content with a visual constructor and AI copilot.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **AI Course Generate** | Authors describe a topic — AI generates full course structure (modules, lessons, blocks) |
| 🎯 **TGP — The Golden Path** | Pre-course placement test. AI evaluates answers → recommends which modules to study fully vs. optionally |
| 🤖 **AI Assistant (Irbis)** | Inline hints, streaming Q&A, code diagnosis — right inside the learning flow |
| 📝 **Visual Content Builder** | Drag-and-drop course constructor with real-time preview |
| 💻 **Code Execution** | Auto-graded coding tasks via Piston sandbox (Python, JS, TS, Go) |
| 🏆 **Profile & Gamification** | Streaks, achievements, weekly/yearly contribution grids |
| 🛡 **Moderation** | AI pre-screening + manual review queue for course publishing |

## 📊 Stack

| Layer | Technologies |
|-------|-------------|
| 🐍 Backend | Python 3.14, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2 |
| 🎨 Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Router + Query |
| 🗄 Database | PostgreSQL 18, Redis 7.2 |
| 🤖 AI | OpenAI-compatible gateway (Gemini/GPT), Celery workers |
| 💾 Storage | Local / S3 (MinIO) via aioboto3 |
| 🧪 Code Exec | Piston v2 sandbox |
| 🐳 Infra | Docker Compose |

## 🚀 Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Backend
cd backend
uv run alembic upgrade head
uv run uvicorn src.main:app --reload

# 3. Frontend
cd frontend
pnpm install
pnpm dev

# 4. AI worker (optional)
cd backend
uv run celery -A src.core.celery_app worker --loglevel=info
```

Open [http://localhost:5173](http://localhost:5173)

### Production deployment

Infra runs in the **Russian Federation** (personal-data localization per 152-ФЗ);
services: **MinIO** (object storage) on the VPS, **PostgreSQL 18 + Redis 7.2**
(self-hosted via Docker), **Yandex 360 / Mail.ru** SMTP, **YooKassa** payments,
optional **Piston** (code exec, profile `codeexec`), **nginx** (SPA + reverse proxy).

Files:

- `Dockerfile.backend` — FastAPI image (also used for the Celery worker & migrations).
- `Dockerfile.frontend` — Vite build (`VITE_API_URL` at build time) → nginx static.
- `docker-compose.prod.yml` — postgres, redis, minio(+init), migrate (one-shot
  `alembic upgrade head`), backend, worker, piston, nginx. Uses prebuilt ghcr images.
- `.env.prod.example` — copy to `.env.prod` on the server and fill in (never commit).
- `deploy/nginx.conf` — nginx (SPA + proxy to the backend upstream).
- `deploy/roll.sh` — zero-downtime rolling deploy (recreate `backend-1`, then `backend`).
- `deploy/backup.sh` — nightly PostgreSQL dump + MinIO mirror to a separate disk.
- `.github/workflows/ci.yml` — black + mypy (backend) and lint + build (frontend) on push/PR.
- `.github/workflows/deploy.yml` — builds & pushes ghcr images on tag `v*`, then SSH-deploys (rolling).

Deploy steps on a RU VPS with Docker (cgroup v2):

```bash
# once — prepare the app dir (compose + .env.prod)
mkdir -p ~/lms && cd ~/lms
# copy docker-compose.prod.yml, deploy/roll.sh and .env.prod (from secrets), then:
#   docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend backend-1 worker nginx migrate
#   bash deploy/roll.sh   # rolling: backend-1 (new) → wait healthy → backend
```

**Zero-downtime rolling.** The app runs two replicas (`backend` + `backend-1`) behind an
nginx `upstream`. `deploy/roll.sh` recreates `backend-1` from the new image, waits for
its healthcheck, then recreates `backend` — so at least one instance is always serving.

**Backups (separate disk on the VPS).** `deploy/backup.sh` does a nightly logical dump of
PostgreSQL + a MinIO mirror of the `lms-media` bucket to `BACKUP_DIR` (default `/var/backups`)
and prunes dumps older than `BACKUP_KEEP_DAYS` (14). Schedule via cron, e.g.:

```bash
0 3 * * * /opt/lms/deploy/backup.sh
```

Redis is not backed up (cache / ephemeral). Restore:

```bash
# PostgreSQL
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean < /var/backups/lms_YYYY-MM-DD.dump
# MinIO (reverse mirror)
docker run --rm --network plm_app_network -v /var/backups/media:/backups minio/mc \
  sh -c "mc alias set local http://minio:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD && mc mirror --overwrite /backups local/\$STORAGE_BUCKET"
```

GitHub Actions secrets for the deploy job: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`,
`ENV_PROD_B64` (base64 of `.env.prod`), `GHCR_USER`, `GHCR_TOKEN` (packages:read),
`VITE_API_URL` (origin, no `/api/v1`). Piston needs the `codeexec` profile and a
cgroup-v2 host.

## 📁 Project Structure

```
├── backend/src/
│   ├── core/           # Shared infrastructure (config, DB, Redis, storage, errors)
│   ├── auth/           # Register / login / refresh / logout
│   ├── user/           # Profiles, staff flag
│   ├── course/         # Courses, enrollment, categories, moderation
│   ├── module/         # Course modules
│   ├── lesson/         # Lessons + per-user progress
│   ├── block/          # Content blocks (text, quiz, code, media)
│   ├── submissions/    # Auto-grading + manual checks
│   ├── codeexec/       # Piston HTTP client
│   ├── media/          # Uploads (local/S3), attachments
│   ├── profile/        # Stats, streaks, contribution grids
│   └── ai/             # TGP, Assistant, Course Review
├── frontend/src/
│   ├── client/         # GENERATED API client — DO NOT EDIT
│   ├── components/     # Shared UI (shadcn/ui) + layout
│   ├── features/       # Feature modules (api/, pages/, components/)
│   ├── styles/         # Tailwind v4 design system
│   └── routes/         # TanStack Router routes
├── docker-compose.yaml
└── scripts/
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint` (frontend) or `uv run mypy .` (backend)
5. Submit a PR

## 📄 License

Proprietary. All rights reserved.

Copyright © 2026 caloz. No part of this software may be reproduced,
distributed, or transmitted in any form or by any means without the prior
written permission of the copyright holder.

**Educational use:** Distribution for non-commercial, educational purposes
(school projects, academic demonstrations) is permitted provided that
all copyright notices are retained.
