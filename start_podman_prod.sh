#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/agent/xingdianping}"
ENV_FILE="${ENV_FILE:-${DEPLOY_DIR}/.env.runtime}"

cd "$DEPLOY_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing runtime env file: $ENV_FILE" >&2
  exit 1
fi

env_value() {
  local key="$1"
  local default_value="${2:-}"
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
  if [ -n "$value" ]; then
    printf '%s' "$value"
  else
    printf '%s' "$default_value"
  fi
}

MYSQL_ROOT_PASSWORD_VALUE="$(env_value MYSQL_ROOT_PASSWORD root)"
MYSQL_DATABASE_VALUE="$(env_value MYSQL_DATABASE xingdianping)"
MYSQL_USER_VALUE="$(env_value MYSQL_USER xingdianping)"
MYSQL_PASSWORD_VALUE="$(env_value MYSQL_PASSWORD xingdianping)"
SEARCH_PROVIDER_VALUE="$(env_value SEARCH_PROVIDER legacy)"
MEILISEARCH_API_KEY_VALUE="$(env_value MEILISEARCH_API_KEY "")"

podman rm -f xdp-web xdp-api xdp-meilisearch xdp-redis xdp-mysql 2>/dev/null || true
podman volume exists xdp-mysql-data >/dev/null 2>&1 || podman volume create xdp-mysql-data >/dev/null
podman volume exists xdp-redis-data >/dev/null 2>&1 || podman volume create xdp-redis-data >/dev/null
podman volume exists xdp-meili-data >/dev/null 2>&1 || podman volume create xdp-meili-data >/dev/null

podman run -d --replace --name xdp-mysql --network host \
  -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD_VALUE" \
  -e MYSQL_DATABASE="$MYSQL_DATABASE_VALUE" \
  -e MYSQL_USER="$MYSQL_USER_VALUE" \
  -e MYSQL_PASSWORD="$MYSQL_PASSWORD_VALUE" \
  -v xdp-mysql-data:/var/lib/mysql \
  docker.m.daocloud.io/library/mysql:8.4

podman run -d --replace --name xdp-redis --network host \
  -v xdp-redis-data:/data \
  docker.m.daocloud.io/library/redis:7.4-alpine

if [ "$SEARCH_PROVIDER_VALUE" = "meilisearch" ]; then
  podman run -d --replace --name xdp-meilisearch --network host \
    -e MEILI_ENV=production \
    -e MEILI_NO_ANALYTICS=true \
    -e MEILI_MASTER_KEY="$MEILISEARCH_API_KEY_VALUE" \
    -v xdp-meili-data:/meili_data \
    getmeili/meilisearch:v1.12
fi

for attempt in $(seq 1 120); do
  if podman exec xdp-mysql mysqladmin ping -h 127.0.0.1 -uroot "-p${MYSQL_ROOT_PASSWORD_VALUE}" --silent >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" = "120" ]; then
    echo "MySQL did not become ready in time." >&2
    podman logs xdp-mysql --tail 100 >&2 || true
    exit 1
  fi
  sleep 2
done

podman run -d --replace --name xdp-api --network host \
  --env-file "$ENV_FILE" \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="mysql+pymysql://${MYSQL_USER_VALUE}:${MYSQL_PASSWORD_VALUE}@127.0.0.1:3306/${MYSQL_DATABASE_VALUE}" \
  -e REDIS_URL=redis://127.0.0.1:6379/0 \
  -e MEILISEARCH_URL=http://127.0.0.1:7700 \
  xdp-api:latest \
  sh -c 'alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000'

for attempt in $(seq 1 120); do
  if curl -fsS http://127.0.0.1:8000/health/ready >/dev/null; then
    break
  fi
  if [ "$attempt" = "120" ]; then
    echo "API did not become ready in time." >&2
    podman logs xdp-api --tail 100 >&2 || true
    exit 1
  fi
  sleep 2
done

podman run -d --replace --name xdp-web --network host \
  --env-file "$ENV_FILE" \
  -e API_INTERNAL_ORIGIN=http://127.0.0.1:8000 \
  -e NEXT_INTERNAL_ORIGIN=http://127.0.0.1:3001 \
  -e PROXY_PORT=3000 \
  -e NEXT_PORT=3001 \
  xdp-web:latest

for attempt in $(seq 1 120); do
  if curl -fsS http://127.0.0.1:3000/xingdp/ >/dev/null \
    && curl -fsS http://127.0.0.1:3000/xingdp/api/health >/dev/null; then
    break
  fi
  if [ "$attempt" = "120" ]; then
    echo "Web did not become ready in time." >&2
    podman logs xdp-web --tail 100 >&2 || true
    exit 1
  fi
  sleep 2
done

podman ps --format '{{.Names}} {{.Status}}'
