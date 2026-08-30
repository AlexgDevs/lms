# Deployment guide (production)

This guide describes how the LMS is built, released and run in production
(self-hosted on a **RU VPS**, per the "personal data in RF" policy / 152-ФЗ).

Related files:

- `Dockerfile.backend` — FastAPI image (also used for the Celery worker & migrations).
- `Dockerfile.frontend` — Vite build (`VITE_API_URL` at build time) → nginx static.
- `docker-compose.prod.yml` — full production stack (services below).
- `.env.prod.example` — copy to `.env.prod` on the server and fill in (never commit).
- `deploy/nginx.conf` — nginx: SPA + reverse proxy to the backend upstream.
- `deploy/roll.sh` — zero-downtime rolling deploy.
- `deploy/backup.sh` — nightly PostgreSQL dump + MinIO mirror.
- `.github/workflows/ci.yml` — checks on push/PR.
- `.github/workflows/deploy.yml` — release on tag `v*` → ghcr images → SSH rolling deploy.

## 1. Stack

| Component | Purpose | Notes |
| --- | --- | --- |
| PostgreSQL 18 | source of truth | self-hosted volume |
| Redis 7.2 | cache, rate limits, Celery broker | **ephemeral** — not backed up |
| MinIO | object storage (media / certificates) | S3-compatible, public-read bucket `lms-media` |
| backend (×2) | FastAPI + uvicorn | two replicas `backend` + `backend-1` behind nginx |
| worker | Celery (AI tasks) | same image, `celery` command |
| migrate | one-shot `alembic upgrade head` | runs before the app starts |
| piston | code execution (optional) | `codeexec` profile, needs cgroup v2 |
| nginx | frontend SPA + reverse proxy | ports 80/443 |

Payments: **YooKassa** (webhook `/api/v1/payments/webhook/yookassa`). Mail: **SMTP**
(Yandex 360 / Mail.ru). AI: OpenAI-compatible gateway (`AI_BASE_URL`).

## 2. Prerequisites

- A RU VPS (or cloud) with **Docker Engine + Compose v2** and **2+ vCPU / 8 GB** RAM.
- **cgroup v2** on the Docker host if you enable Piston (Linux: `uname -r` ≥ 5.8; WSL2
  needs `kernelCommandLine=cgroup_no_v1=all` in `%UserProfile%\.wslconfig`).
- A domain + HTTPS (Let’s Encrypt) — nginx listens on 80/443.
- GitHub repo with a **ghcr** container registry (works out of the box).

## 3. Environment (`.env.prod`)

Copy `.env.prod.example` → `.env.prod` on the server and fill in. Never commit it
(also excluded by `.dockerignore`). Groups:

- `PUBLIC_URL`, `REGISTRY_NS`, `IMAGE_TAG` — public origin + image refs.
- `POSTGRES_*`, `REDIS_*`, `MINIO_*` / `STORAGE_*` — infra.
- `JWT_SECRET_KEY`, `APP_ENV=production`, `CORS_ORIGINS`.
- `YOOKASSA_*` (payments, `PAYMENT_PROVIDER_MODE=yookassa`, sandbox off).
- `AI_*` (gateway), `SMTP_*` (Yandex 360), `CODEEXEC_BASE_URL=http://piston:2000`.
- `BACKUP_DIR`, `BACKUP_KEEP_DAYS`.

> `VITE_API_URL` is **build-time only** (baked into the SPA); it is the **origin**
> without `/api/v1` — the generated client appends `/api/v1`, notifications use `/notifications`.

## 4. Build & images

Images are built once in CI and pushed to `ghcr.io/${REGISTRY_NS}/backend|frontend:${IMAGE_TAG}`.
The production compose pulls **prebuilt images** — the server does not need the source.

- `Dockerfile.backend`: Python 3.14 + uv; `uv sync --frozen`; code + alembic; CMD `uvicorn`.
- `Dockerfile.frontend`: Node 22 → `pnpm build` (with `VITE_API_URL`) → nginx serving `dist/`.

## 5. First deployment

On the server:

```bash
mkdir -p ~/lms && cd ~/lms
# place docker-compose.prod.yml, deploy/roll.sh, deploy/nginx.conf, deploy/backup.sh and .env.prod

# login to the registry
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

# pull + apply migrations + start
docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend backend-1 worker nginx migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

(On a fresh host `minio-init` creates the bucket + public-read; `migrate` applies all
migrations; `backend`/`backend-1` become healthy; nginx starts.)

## 6. Rolling deploy (zero-downtime)

The app runs two replicas (`backend` + `backend-1`) behind an nginx `upstream`. A release:

```bash
bash deploy/roll.sh
```

What `roll.sh` does:

1. `docker compose ... pull backend backend-1 worker nginx migrate`
2. `docker compose ... run --rm migrate` (one-shot `alembic upgrade head`)
3. `docker compose ... up -d --no-deps --force-recreate backend-1` (new image; old `backend` keeps serving)
4. waits until `backend-1` reports `healthy`
5. `docker compose ... up -d --no-deps --force-recreate backend` (new image; `backend-1` still serving)

Because nginx `proxy_next_upstream error timeout http_502 http_503` retries on the healthy
replica, there is **no downtime** while either instance restarts.

### Via CI/CD (recommended)

Push a tag to trigger a release:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

`.github/workflows/deploy.yml` will: build & push `backend`/`frontend` images to ghcr
(`latest` + tag) → SSH into the host → write `.env.prod` (base64) → `docker login ghcr.io` →
`bash deploy/roll.sh`.

`ci.yml` runs on push/PR to `dev`/`main`: `black --check` + `mypy` (backend) and
`pnpm lint` + `pnpm build` (frontend).

### GitHub Actions secrets

| Secret | Description |
| --- | --- |
| `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` | deploy target |
| `ENV_PROD_B64` | base64 of the `.env.prod` file |
| `GHCR_USER`, `GHCR_TOKEN` | PAT with `packages:read` (pulls images on the server) |
| `VITE_API_URL` | frontend **origin** (build-time), e.g. `https://lms.example.ru` |

## 7. Healthchecks & lifecycle

- `migrate` runs before the app: `backend`/`backend-1` `depends_on: migrate: service_completed_successfully`.
- `backend`/`backend-1` expose `GET /hello` and are checked via a Python healthcheck.
- `restart: unless-stopped`; named volumes for Postgres/Redis/MinIO keep state across restarts.

## 8. Backups & restore

`deploy/backup.sh` (nightly, cron `0 3 * * *`):

```bash
# PostgreSQL logical dump
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" -Fc > "$BACKUP_DIR/lms_$(date +%F).dump"

# MinIO bucket mirror
docker run --rm --network plm_app_network -v "$BACKUP_DIR/media:/backups" minio/mc \
  sh -c "mc alias set local http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && mc mirror --overwrite local/$STORAGE_BUCKET /backups"

# prune older than BACKUP_KEEP_DAYS
find "$BACKUP_DIR" -name 'lms_*.dump' -mtime +$BACKUP_KEEP_DAYS -delete
```

Defaults: `BACKUP_DIR=/var/backups` (mount a **separate disk** there), `BACKUP_KEEP_DAYS=14`.
Redis is **not** backed up (cache / queue — safe to lose).

Restore:

```bash
# PostgreSQL (from the latest dump)
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean < "$BACKUP_DIR/lms_YYYY-MM-DD.dump"

# MinIO (reverse mirror from the backup disk)
docker run --rm --network plm_app_network -v "$BACKUP_DIR/media:/backups" minio/mc \
  sh -c "mc alias set local http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && mc mirror --overwrite /backups local/$STORAGE_BUCKET"
```

## 9. Notes & troubleshooting

- **Piston** is optional: without it, CODE submissions that have test cases return `503`.
  Enable with `docker compose --profile codeexec up -d piston` (needs cgroup v2).
- **Media** is served by nginx (`/media/…` → MinIO `/lms-media/…`); `STORAGE_PUBLIC_BASE_URL`
  must equal `${PUBLIC_URL}/media`. Private (non-public) media uses presigned URLs that point
  at internal MinIO — for MVP keep media public.
- **Migrations** are applied by the `migrate` one-shot; on a schema change run `alembic revision
  --autogenerate` locally (from the repo root) and commit before releasing.
- Only `app`, `worker` and `migrate` connect to internal minio/redis/postgres by service name
  (Docker DNS); only `nginx` publishes 80/443.
- If `mypy` fails in CI, it must be fixed — CI is a hard gate before deploy.
