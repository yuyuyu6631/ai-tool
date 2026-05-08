#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/agent/xingdianping}"
BRANCH="${BRANCH:-main}"

cd "$DEPLOY_DIR"

if [ -d .git ]; then
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

chmod +x ./start_podman_prod.sh

podman build \
  -t xdp-api:latest \
  -f Containerfile.api.prod .

podman build \
  --build-arg SERVER_API_BASE_URL=http://127.0.0.1:8000 \
  --build-arg NEXT_PUBLIC_BASE_PATH=/xingdp \
  --build-arg NEXT_PUBLIC_PUBLIC_BASE_PATH=/xingdp \
  --build-arg NEXT_PUBLIC_API_BASE_PATH=/xingdp \
  -t xdp-web:latest \
  -f Containerfile.web.prod .

./start_podman_prod.sh

curl -fsS http://127.0.0.1:3000/xingdp/ >/dev/null
curl -fsS http://127.0.0.1:3000/xingdp/api/health >/dev/null
curl -fsS http://127.0.0.1:8000/health/ready >/dev/null

echo "Podman production deploy complete."
