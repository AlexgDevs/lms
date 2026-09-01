# Starts the Celery worker for the LMS backend (Windows / PowerShell).
# Requires Redis to be running: `docker compose up -d redis`.
# Run from anywhere; it works relative to the repo root.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

Set-Location $backend
uv run celery -A src.core.celery_app worker --loglevel=info
