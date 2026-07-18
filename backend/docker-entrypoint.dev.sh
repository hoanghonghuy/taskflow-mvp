#!/bin/sh
set -e
cd /app

LOCK_HASH=$(cksum package-lock.json 2>/dev/null | awk '{print $1}')
MARKER=node_modules/.taskflow-lock-hash

if [ ! -d node_modules/.bin ] || [ ! -f "$MARKER" ] || [ "$(cat "$MARKER" 2>/dev/null)" != "$LOCK_HASH" ]; then
  echo "[backend] Installing npm dependencies..."
  npm ci
  npx prisma generate
  mkdir -p node_modules
  echo "$LOCK_HASH" > "$MARKER"
fi

# Migrate mỗi lần start (idempotent) — schema luôn khớp DB.
npx prisma migrate deploy

exec "$@"
