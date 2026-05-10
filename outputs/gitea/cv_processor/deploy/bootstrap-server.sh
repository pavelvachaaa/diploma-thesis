#!/bin/sh
set -eu

resolve_deploy_dir() {
  if [ -f "$(pwd)/compose.yaml" ]; then
    pwd
    return
  fi

  script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

  if [ -f "$script_dir/compose.yaml" ]; then
    printf '%s\n' "$script_dir"
    return
  fi

  if [ -f "$script_dir/../compose.yaml" ]; then
    CDPATH= cd -- "$script_dir/.." && pwd
    return
  fi

  printf '%s\n' "$script_dir"
}

say() {
  printf '[INFO] %s\n' "$1"
}

fail() {
  printf '[ERROR] %s\n' "$1" >&2
  exit 1
}

require_file() {
  [ -f "$1" ] || fail "Missing required file: $1"
}

DEPLOY_DIR=$(resolve_deploy_dir)
COMPOSE_FILE="$DEPLOY_DIR/compose.yaml"
RUNTIME_FILE="$DEPLOY_DIR/.env.runtime"
SECRETS_FILE="$DEPLOY_DIR/.env.secrets"
LOG_DIR="$DEPLOY_DIR/logs"

compose_cmd() {
  docker compose --env-file "$RUNTIME_FILE" -f "$COMPOSE_FILE" "$@"
}

wait_for_tika() {
  attempt=1

  while [ "$attempt" -le 30 ]; do
    tika_container_id=$(compose_cmd ps -q tika)
    if [ -n "$tika_container_id" ]; then
      tika_status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$tika_container_id" 2>/dev/null || true)

      case "$tika_status" in
        healthy)
          return 0
          ;;
        unhealthy)
          fail "Tika healthcheck reported unhealthy"
          ;;
      esac
    fi

    sleep 2
    attempt=$((attempt + 1))
  done

  fail "Timed out waiting for Tika healthcheck"
}

say "Using deploy directory: $DEPLOY_DIR"
mkdir -p "$LOG_DIR"

require_file "$COMPOSE_FILE"
require_file "$RUNTIME_FILE"
require_file "$SECRETS_FILE"

say "Ensuring external Docker network 'kz' exists"
docker network inspect kz >/dev/null 2>&1 || docker network create kz -d bridge

say "Pulling runtime images"
compose_cmd pull tika cv-processor

say "Starting Tika"
compose_cmd up -d tika
wait_for_tika

say "Starting CV processor"
compose_cmd up -d cv-processor

say "Bootstrap finished"
compose_cmd ps
