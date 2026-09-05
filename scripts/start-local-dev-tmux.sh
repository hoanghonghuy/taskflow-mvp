#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/ubuntu/taskflow-mvp"
COMPOSE_FILE="$ROOT_DIR/docker-compose.local.yml"
BACKEND_SESSION="taskflow-backend-local"
FRONTEND_SESSION="taskflow-frontend-local"
POSTGRES_SERVICE="postgres"
POSTGRES_HEALTH_TIMEOUT_SECONDS=60

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[taskflow] Missing required command: $1" >&2
    exit 1
  fi
}

start_tmux_session() {
  local session_name="$1"
  local workdir="$2"
  local command="$3"

  tmux kill-session -t "$session_name" 2>/dev/null || true
  tmux new-session -d -s "$session_name" \
    "bash -lc 'cd \"$workdir\" && exec $command'"
}

wait_for_postgres() {
  local container_id
  local health_status
  local elapsed=0

  container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$POSTGRES_SERVICE")"
  if [[ -z "$container_id" ]]; then
    echo "[taskflow] Could not find postgres container" >&2
    exit 1
  fi

  while (( elapsed < POSTGRES_HEALTH_TIMEOUT_SECONDS )); do
    health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    if [[ "$health_status" == "healthy" ]]; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "[taskflow] Postgres did not become healthy within ${POSTGRES_HEALTH_TIMEOUT_SECONDS}s" >&2
  exit 1
}

require_cmd docker
require_cmd tmux
require_cmd node
require_cmd npm

NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

cd "$ROOT_DIR"
docker compose -f "$COMPOSE_FILE" up -d
wait_for_postgres

start_tmux_session \
  "$BACKEND_SESSION" \
  "$ROOT_DIR/backend" \
  "\"$NODE_BIN\" --env-file=.env \"$NPM_BIN\" run dev"
start_tmux_session \
  "$FRONTEND_SESSION" \
  "$ROOT_DIR/frontend" \
  "\"$NODE_BIN\" --env-file=.env \"$NPM_BIN\" run dev"

echo "[taskflow] Started $BACKEND_SESSION and $FRONTEND_SESSION"
