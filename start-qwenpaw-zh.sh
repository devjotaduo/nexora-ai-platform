#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy

export QWENPAW_AUTH_ENABLED="${QWENPAW_AUTH_ENABLED:-true}"
export NEXORA_DB_URL="${NEXORA_DB_URL:-postgresql+psycopg2://nexora:nexora_dev_password@127.0.0.1:5432/nexora}"

# --- 100-user tuning ---
export NEXORA_DB_POOL_SIZE="${NEXORA_DB_POOL_SIZE:-10}"
export NEXORA_DB_MAX_OVERFLOW="${NEXORA_DB_MAX_OVERFLOW:-20}"
export NEXORA_MAX_ACTIVE_AGENTS="${NEXORA_MAX_ACTIVE_AGENTS:-50}"
export NEXORA_AGENT_IDLE_TTL_SECONDS="${NEXORA_AGENT_IDLE_TTL_SECONDS:-1800}"

exec .venv/bin/qwenpaw app --host 127.0.0.1 --port "${QWENPAW_PORT:-8088}"
