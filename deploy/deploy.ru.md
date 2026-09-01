# Гайд по деплою (прод)

Гайд описывает, как LMS собирается, релизится и работает в продакшене
(self-hosted на **RU VPS**, по политике «персональные данные в РФ» / 152-ФЗ).

Связанные файлы:

- `Dockerfile.backend` — образ FastAPI (используется и для Celery-воркера, и для миграций).
- `Dockerfile.frontend` — сборка Vite (`VITE_API_URL` на этапе сборки) → статика nginx.
- `docker-compose.prod.yml` — полный прод-стек (сервисы ниже).
- `.env.prod.example` — копия в `.env.prod` на сервере, заполнить (никогда не коммитить).
- `deploy/nginx.conf` — nginx: SPA + reverse-proxy на upstream бэкенда.
- `deploy/roll.sh` — rolling-деплой без простоя.
- `deploy/backup.sh` — ночной дамп PostgreSQL + mirror MinIO.
- `.github/workflows/ci.yml` — проверки на push/PR.
- `.github/workflows/deploy.yml` — релиз по тегу `v*` → образы ghcr → SSH rolling-деплой.

## 1. Стек

| Компонент | Назначение | Примечания |
| --- | --- | --- |
| PostgreSQL 18 | источник истины | self-hosted volume |
| Redis 7.2 | кеш, лимиты, брокер Celery | **эвемерный** — не бэкапится |
| MinIO | хранилище (медиа / сертификаты) | S3-совместимое, public-read бакет `lms-media` |
| backend (×2) | FastAPI + uvicorn | две реплики `backend` + `backend-1` за nginx |
| worker | Celery (AI-задачи) | тот же образ, команда `celery` |
| migrate | one-shot `alembic upgrade head` | запускается перед стартом приложения |
| piston | запуск кода (опционально) | profile `codeexec`, нужен cgroup v2 |
| nginx | SPA-фронт + reverse-proxy | порты 80/443 |

Оплата: **YooKassa** (вебхук `/api/v1/payments/webhook/yookassa`). Почта: **SMTP**
(Yandex 360 / Mail.ru). AI: OpenAI-совместимый шлюз (`AI_BASE_URL`).

## 2. Предусловия

- RU VPS (или облако) с **Docker Engine + Compose v2** и **2+ vCPU / 8 ГБ** RAM.
- **cgroup v2** на хосте, если включаешь Piston (Linux: `uname -r` ≥ 5.8; для WSL2 нужен
  `kernelCommandLine=cgroup_no_v1=all` в `%UserProfile%\.wslconfig`).
- Домен + HTTPS (Let’s Encrypt) — nginx слушает 80/443.
- GitHub-репозиторий с реестром **ghcr** (работает из коробки).

## 3. Переменные окружения (`.env.prod`)

Скопировать `.env.prod.example` → `.env.prod` на сервере и заполнить. Никогда не коммитить
(также исключено `.dockerignore`). Группы:

- `PUBLIC_URL`, `REGISTRY_NS`, `IMAGE_TAG` — публичный origin + ссылки на образы.
- `POSTGRES_*`, `REDIS_*`, `MINIO_*` / `STORAGE_*` — инфраструктура.
- `JWT_SECRET_KEY`, `APP_ENV=production`, `CORS_ORIGINS`.
- `YOOKASSA_*` (оплата, `PAYMENT_PROVIDER_MODE=yookassa`, sandbox выключен).
- `AI_*` (шлюз), `SMTP_*` (Yandex 360), `CODEEXEC_BASE_URL=http://piston:2000`.
- `BACKUP_DIR`, `BACKUP_KEEP_DAYS`.

> `VITE_API_URL` — **только на этапе сборки** (зашивается в SPA); это **origin**
> без `/api/v1` — сгенерированный клиент сам добавляет `/api/v1`, а уведомления идут на `/notifications`.

## 4. Сборка и образы

Образы собираются один раз в CI и пушатся в `ghcr.io/${REGISTRY_NS}/backend|frontend:${IMAGE_TAG}`.
Прод-compose **тянет готовые образы** — на сервере исходники не нужны.

- `Dockerfile.backend`: Python 3.14 + uv; `uv sync --frozen`; код + alembic; CMD `uvicorn`.
- `Dockerfile.frontend`: Node 22 → `pnpm build` (с `VITE_API_URL`) → nginx отдаёт `dist/`.

## 5. Первый деплой

На сервере:

```bash
mkdir -p ~/lms && cd ~/lms
# разместить docker-compose.prod.yml, deploy/roll.sh, deploy/nginx.conf, deploy/backup.sh и .env.prod

# логин в реестр
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

# pull + миграции + старт
docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend backend-1 worker nginx migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

(На свежем хосте `minio-init` создаёт бакет + public-read; `migrate` применяет все миграции;
`backend`/`backend-1` становятся healthy; стартует nginx.)

## 6. Rolling-деплой (без простоя)

Приложение работает на двух репликах (`backend` + `backend-1`) за nginx `upstream`. Релиз:

```bash
bash deploy/roll.sh
```

Что делает `roll.sh`:

1. `docker compose ... pull backend backend-1 worker nginx migrate`
2. `docker compose ... run --rm migrate` (одноразовый `alembic upgrade head`)
3. `docker compose ... up -d --no-deps --force-recreate backend-1` (новый образ; старый `backend` продолжает обслуживать)
4. ждёт, пока `backend-1` станет `healthy`
5. `docker compose ... up -d --no-deps --force-recreate backend` (новый образ; `backend-1` ещё обслуживает)

Т.к. nginx использует `proxy_next_upstream error timeout http_502 http_503` и ретраит на здоровую
реплику, **простоя нет**, пока перезапускается любая из них.

### Через CI/CD (рекомендуется)

Пуш тега запускает релиз:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

`.github/workflows/deploy.yml`: соберёт и запушит `backend`/`frontend` в ghcr
(`latest` + тег) → SSH на хост → запись `.env.prod` (base64) → `docker login ghcr.io` →
`bash deploy/roll.sh`.

`ci.yml` срабатывает на push/PR в `dev`/`main`: `black --check` + `mypy` (бэкенд) и
`pnpm lint` + `pnpm build` (фронтенд).

### Секреты GitHub Actions

| Секрет | Описание |
| --- | --- |
| `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` | цель деплоя |
| `ENV_PROD_B64` | base64 файла `.env.prod` |
| `GHCR_USER`, `GHCR_TOKEN` | PAT с `packages:read` (тащит образы на сервере) |
| `VITE_API_URL` | **origin** фронта (на сборке), например `https://lms.example.ru` |
| `VITE_PUBLIC_URL` | публичный origin платформы (на сборке), например `https://lms.example.ru` |

## 7. Healthcheck и жизненный цикл

- `migrate` выполняется до приложения: `backend`/`backend-1` `depends_on: migrate: service_completed_successfully`.
- `backend`/`backend-1` отдают `GET /hello` и проверяются Python-healthcheck'ом.
- `restart: unless-stopped`; именованные volume для Postgres/Redis/MinIO сохраняют состояние между перезапусками.

## 8. Бэкапы и восстановление

`deploy/backup.sh` (ночной, cron `0 3 * * *`):

```bash
# Логический дамп PostgreSQL
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" -Fc > "$BACKUP_DIR/lms_$(date +%F).dump"

# Mirror бакета MinIO
docker run --rm --network plm_app_network -v "$BACKUP_DIR/media:/backups" minio/mc \
  sh -c "mc alias set local http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && mc mirror --overwrite local/$STORAGE_BUCKET /backups"

# удаление старых, старше BACKUP_KEEP_DAYS
find "$BACKUP_DIR" -name 'lms_*.dump' -mtime +$BACKUP_KEEP_DAYS -delete
```

По умолчанию: `BACKUP_DIR=/var/backups` (смонтируй туда **отдельный диск**), `BACKUP_KEEP_DAYS=14`.
Redis **не** бэкапится (кеш/очередь — потеря не страшна).

Восстановление:

```bash
# PostgreSQL (из последнего дампа)
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean < "$BACKUP_DIR/lms_YYYY-MM-DD.dump"

# MinIO (обратный mirror с диска бэкапа)
docker run --rm --network plm_app_network -v "$BACKUP_DIR/media:/backups" minio/mc \
  sh -c "mc alias set local http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && mc mirror --overwrite /backups local/$STORAGE_BUCKET"
```

## 9. Заметки и troubleshooting

- **Piston** опционален: без него CODE-блоки с тест-кейсами возвращают `503`.
  Включается `docker compose --profile codeexec up -d piston` (нужен cgroup v2).
- **Медиа** отдаёт nginx (`/media/…` → MinIO `/lms-media/…`); `STORAGE_PUBLIC_BASE_URL`
  должен равняться `${PUBLIC_URL}/media`. Приватные (non-public) медиа используют presigned-URL,
  ведущие на внутренний MinIO — для MVP держи медиа публичным.
- **Миграции** применяет одноразовый `migrate`; при изменении схемы локально (из корня репо)
  запусти `alembic revision --autogenerate` и закоммить перед релизом.
- Внутренние сервисы общаются по именам Docker DNS; наружу публикует только `nginx` (80/443).
- Если `mypy` падает в CI — это надо чинить: CI — жёсткий гейт перед деплоем.
