#!/usr/bin/env bash
# Rolling (zero-downtime) deploy for docker-compose.prod.yml.
# Runs backend-1 (new image) while backend keeps serving, waits for health,
# then recreates backend. At least one replica is healthy at all times.
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
SERVICES="backend backend-1 worker nginx migrate"

cd "$(dirname "$0")/.."

echo "==> Pulling images"
$COMPOSE pull $SERVICES

echo "==> Applying DB migrations"
$COMPOSE run --rm migrate

echo "==> Recreating backend-1 (new image)"
$COMPOSE up -d --no-deps --force-recreate backend-1

echo "==> Waiting for backend-1 to become healthy"
attempt=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($COMPOSE ps -q backend-1)" 2>/dev/null)" = "healthy" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 60 ]; then
    echo "!! backend-1 did not become healthy; aborting roll" >&2
    exit 1
  fi
  sleep 2
done

echo "==> Recreating backend (new image)"
$COMPOSE up -d --no-deps --force-recreate backend

echo "==> Recreating worker and nginx (frontend)"
$COMPOSE up -d --no-deps --force-recreate worker nginx

echo "==> Done"
