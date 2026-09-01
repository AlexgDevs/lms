#!/usr/bin/env bash
# Nightly backup to a separate disk on the VPS.
# - PostgreSQL logical dump (pg_dump)
# - MinIO bucket mirror (mc) to <BACKUP_DIR>/media
# - prune dumps older than BACKUP_KEEP_DAYS
# Schedule via cron, e.g.:  0 3 * * * /opt/lms/deploy/backup.sh
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
. ./.env.prod
set +a

BACKUP_DIR="${BACKUP_DIR:-/var/backups}"
DATE="$(date +%F)"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
NETWORK="$(docker network ls -qf name=plm_app_network | head -n1)"

mkdir -p "$BACKUP_DIR/media"

echo "==> Backing up PostgreSQL"
$COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" -Fc \
  > "$BACKUP_DIR/lms_${DATE}.dump"

echo "==> Miroring MinIO bucket '$STORAGE_BUCKET' -> $BACKUP_DIR/media"
docker run --rm --network "$NETWORK" \
  -v "$BACKUP_DIR/media:/backups" \
  -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
  -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  -e STORAGE_BUCKET="$STORAGE_BUCKET" \
  minio/mc sh -c "mc alias set local http://minio:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD \
    && mc mirror --overwrite local/\$STORAGE_BUCKET /backups"

echo "==> Pruning backups older than ${BACKUP_KEEP_DAYS:-14} days"
find "$BACKUP_DIR" -name 'lms_*.dump' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete

echo "==> Backup done: $BACKUP_DIR"
