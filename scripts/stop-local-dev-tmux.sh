#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/ubuntu/taskflow-mvp"
COMPOSE_FILE="$ROOT_DIR/docker-compose.local.yml"
BACKEND_SESSION="taskflow-backend-local"
FRONTEND_SESSION="taskflow-frontend-local"

tmux kill-session -t "$BACKEND_SESSION" 2>/dev/null || true
tmux kill-session -t "$FRONTEND_SESSION" 2>/dev/null || true

cd "$ROOT_DIR"
docker compose -f "$COMPOSE_FILE" down

echo "[taskflow] Stopped local Docker infra and tmux sessions"
