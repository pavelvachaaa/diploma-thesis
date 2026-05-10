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
NEXT_RUNTIME_FILE="$DEPLOY_DIR/.env.runtime.next"
SECRETS_FILE="$DEPLOY_DIR/.env.secrets"
BACKUP_FILE="$DEPLOY_DIR/.env.runtime.rollback"
LOG_DIR="$DEPLOY_DIR/logs"
PRUNE_LOG="$LOG_DIR/image-prune.log"
DEPLOY_STARTED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
BACKUP_EXISTS=0

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

rollback() {
  if [ "$BACKUP_EXISTS" -ne 1 ] || [ ! -f "$BACKUP_FILE" ]; then
    say "No previous runtime configuration available for rollback"
    rm -f "$RUNTIME_FILE"
    return
  fi

  say "Restoring previous runtime configuration"
  cp "$BACKUP_FILE" "$RUNTIME_FILE"
  compose_cmd pull tika cv-processor >/dev/null 2>&1 || true
  compose_cmd up -d tika cv-processor >/dev/null 2>&1 || true
}

cleanup_on_exit() {
  status=$?

  if [ "$status" -ne 0 ]; then
    rollback
  fi

  rm -f "$BACKUP_FILE"

  exit "$status"
}

launch_image_prune() {
  export PRUNE_LOG

  nohup sh -c '
    {
      printf "[%s] Starting image prune\n" "$(date -u "+%Y-%m-%dT%H:%M:%SZ")"
      docker image prune -a -f --filter "until=168h"
      prune_status=$?
      printf "[%s] Image prune finished with exit code %s\n" "$(date -u "+%Y-%m-%dT%H:%M:%SZ")" "$prune_status"
      exit "$prune_status"
    } >> "$PRUNE_LOG" 2>&1
  ' >/dev/null 2>&1 &
}

trap 'cleanup_on_exit' EXIT

say "Using deploy directory: $DEPLOY_DIR"
mkdir -p "$LOG_DIR"

require_file "$COMPOSE_FILE"
require_file "$NEXT_RUNTIME_FILE"
require_file "$SECRETS_FILE"

say "Ensuring external Docker network 'kz' exists"
docker network inspect kz >/dev/null 2>&1 || docker network create kz -d bridge

if [ -f "$RUNTIME_FILE" ]; then
  cp "$RUNTIME_FILE" "$BACKUP_FILE"
  BACKUP_EXISTS=1
fi

cp "$NEXT_RUNTIME_FILE" "$RUNTIME_FILE"

say "Pulling deployment images"
compose_cmd pull tika cv-processor

say "Starting Tika"
compose_cmd up -d tika
wait_for_tika

say "Starting CV processor"
compose_cmd up -d cv-processor

sleep 10

cv_processor_container_id=$(compose_cmd ps -q cv-processor)
[ -n "$cv_processor_container_id" ] || fail "cv-processor container not found after deploy"

cv_processor_status=$(docker inspect -f '{{.State.Status}}' "$cv_processor_container_id" 2>/dev/null || true)
[ "$cv_processor_status" = "running" ] || fail "cv-processor is not running after deploy (status: $cv_processor_status)"

cv_processor_restarts=$(docker inspect -f '{{.RestartCount}}' "$cv_processor_container_id" 2>/dev/null || printf '0')
[ "$cv_processor_restarts" = "0" ] || fail "cv-processor restarted unexpectedly ($cv_processor_restarts)"

expected_image=$(sed -n 's/^CV_PROCESSOR_IMAGE=//p' "$RUNTIME_FILE" | tail -n 1)
[ -n "$expected_image" ] || fail "CV_PROCESSOR_IMAGE is missing from .env.runtime"

actual_image=$(docker inspect -f '{{.Config.Image}}' "$cv_processor_container_id" 2>/dev/null || true)
[ "$actual_image" = "$expected_image" ] || fail "Running image mismatch (expected: $expected_image, actual: $actual_image)"

startup_logs=$(docker logs "$cv_processor_container_id" --since "$DEPLOY_STARTED_AT" 2>&1 || true)
if printf '%s\n' "$startup_logs" | grep -E 'Failed to connect to RabbitMQ|Failed to create publisher|Failed to create SeaweedFS client' >/dev/null 2>&1; then
  fail "cv-processor startup logs contain fatal initialization errors"
fi

rm -f "$NEXT_RUNTIME_FILE" "$BACKUP_FILE"

launch_image_prune

say "Deployment verified successfully"
