#!/bin/sh
set -e
cd /app

# Named volume có thể trống lần đầu — cài deps nếu thiếu hoặc package-lock đổi.
LOCK_HASH=$(cksum package-lock.json 2>/dev/null | awk '{print $1}')
MARKER=node_modules/.taskflow-lock-hash

if [ ! -d node_modules/.bin ] || [ ! -f "$MARKER" ] || [ "$(cat "$MARKER" 2>/dev/null)" != "$LOCK_HASH" ]; then
  echo "[frontend] Installing npm dependencies..."
  npm ci
  mkdir -p node_modules
  echo "$LOCK_HASH" > "$MARKER"
fi

exec "$@"
