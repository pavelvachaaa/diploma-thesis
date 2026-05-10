#!/usr/bin/env bash
set -Eeuo pipefail

# =====================
# Defaults
# =====================
COMPOSE_FILE="docker-compose.yml"
WITH_AI=true
DO_BUILD=true
DO_PULL=false
DO_PRUNE=false
DO_UMAMI_BOOTSTRAP=true

PROJECT_SERVICES=(
  db
  rabbitmq
  seaweedfs
  qualification-adapter
  user-search-adapter
  hr-backend
  umami
)

BUILD_SERVICES=(
  hr-backend
  migration
  qualification-adapter
  user-search-adapter
)

AI_SERVICES=(
  # Add AI-related services here if they are defined in docker-compose.yml
  # Example:
  # cv-processor
  # job-processor
)

ONE_SHOT_SERVICES=(
  migration
  umami-db-init
  umami-bootstrap
)

# =====================
# Colors
# =====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
print_debug()   { echo -e "${GRAY}[DEBUG]${NC} $1"; }

# =====================
# Usage
# =====================
usage() {
  cat <<EOF
Usage:
  ./deploy.sh [options]

Options:
  --without-ai              Do not deploy AI-related services
  --no-build                Skip docker compose build
  --pull                    Pull base/service images before deploy
  --prune                   Prune unused Docker images after deploy
  --no-umami-bootstrap      Skip Umami website bootstrap
  -f, --compose-file FILE   Compose file to use, default: docker-compose.yml
  -h, --help                Show this help

Examples:
  ./deploy.sh
  ./deploy.sh --pull --prune
  ./deploy.sh --without-ai
  ./deploy.sh -f docker-compose.prod.yml
EOF
}

# =====================
# Error handling
# =====================
on_error() {
  local exit_code=$?
  local line_no=${1:-unknown}

  print_error "Deployment failed on line ${line_no} with exit code ${exit_code}"

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 && [[ -f "${COMPOSE_FILE}" ]]; then
    print_status "Current Compose status:"
    compose_cmd ps || true

    print_status "Recent logs:"
    compose_cmd logs --tail=80 hr-backend qualification-adapter user-search-adapter migration umami umami-db-init umami-bootstrap db rabbitmq seaweedfs || true
  fi

  exit "${exit_code}"
}

trap 'on_error $LINENO' ERR

# =====================
# Arg parsing
# =====================
while [[ $# -gt 0 ]]; do
  case "$1" in
    --without-ai|--withoutAI)
      WITH_AI=false
      shift
      ;;
    --no-build)
      DO_BUILD=false
      shift
      ;;
    --pull)
      DO_PULL=true
      shift
      ;;
    --prune)
      DO_PRUNE=true
      shift
      ;;
    --no-umami-bootstrap)
      DO_UMAMI_BOOTSTRAP=false
      shift
      ;;
    -f|--compose-file)
      COMPOSE_FILE="${2:-}"
      if [[ -z "${COMPOSE_FILE}" ]]; then
        print_error "Missing value for $1"
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      print_error "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

# =====================
# Helper
# =====================
compose_cmd() {
  docker compose -f "${COMPOSE_FILE}" "$@"
}

service_exists() {
  local service="$1"
  compose_cmd config --services | grep -qx "${service}"
}

filter_existing_services() {
  local existing=()

  for service in "$@"; do
    if service_exists "${service}"; then
      existing+=("${service}")
    else
      print_debug "Skipping missing service: ${service}"
    fi
  done

  printf '%s\n' "${existing[@]}"
}

wait_for_healthy() {
  local service="$1"
  local timeout_seconds="${2:-60}"
  local elapsed=0

  print_status "Waiting for ${service} to become healthy..."

  while (( elapsed < timeout_seconds )); do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${service}" 2>/dev/null || true)"

    case "${status}" in
      healthy)
        print_success "${service} is healthy"
        return 0
        ;;
      exited|dead)
        print_error "${service} is ${status}"
        compose_cmd logs --tail=80 "${service}" || true
        return 1
        ;;
      "")
        print_debug "${service} not created yet"
        ;;
      *)
        print_debug "${service} status: ${status}"
        ;;
    esac

    sleep 2
    elapsed=$((elapsed + 2))
  done

  print_warning "${service} healthcheck timeout after ${timeout_seconds}s"
  compose_cmd ps "${service}" || true
  compose_cmd logs --tail=50 "${service}" || true
  return 1
}

run_one_shot() {
  local service="$1"

  print_status "Running one-shot service: ${service}"

  compose_cmd up --no-deps "${service}" --exit-code-from "${service}"

  print_success "${service} completed successfully"
  compose_cmd rm -f "${service}" >/dev/null 2>&1 || true
}

ensure_network() {
  local network="$1"
  local internal="${2:-false}"

  if docker network inspect "${network}" >/dev/null 2>&1; then
    print_success "Network exists: ${network}"
    return 0
  fi

  print_status "Creating Docker network: ${network}"

  if [[ "${internal}" == "true" ]]; then
    docker network create "${network}" --driver bridge --internal >/dev/null
  else
    docker network create "${network}" --driver bridge >/dev/null
  fi

  print_success "Network created: ${network}"
}

# =====================
# Validation
# =====================
print_status "Starting deployment with Docker Compose V2..."

if ! command -v docker >/dev/null 2>&1; then
  print_error "Docker is not installed or not available in PATH"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  print_error "Docker Compose V2 is not available"
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  print_error "Missing compose file: ${COMPOSE_FILE}"
  exit 1
fi

if [[ ! -f ".env" ]]; then
  print_warning "Missing .env file. Compose may fail if required variables are not set."
fi

print_status "Validating Compose configuration..."
compose_cmd config >/dev/null

# =====================
# Networks
# =====================
print_status "Checking Docker networks..."

ensure_network "monitoring_network"
ensure_network "app-network"

# adapter-internal is defined by Compose as non-external in your compose file.
# Do not create it manually unless you change it to external:true.

# =====================
# Resolve services
# =====================
mapfile -t EXISTING_BUILD_SERVICES < <(filter_existing_services "${BUILD_SERVICES[@]}")
mapfile -t EXISTING_PROJECT_SERVICES < <(filter_existing_services "${PROJECT_SERVICES[@]}")
mapfile -t EXISTING_AI_SERVICES < <(filter_existing_services "${AI_SERVICES[@]}")

if [[ "${WITH_AI}" == "true" && ${#EXISTING_AI_SERVICES[@]} -gt 0 ]]; then
  EXISTING_PROJECT_SERVICES+=("${EXISTING_AI_SERVICES[@]}")
  EXISTING_BUILD_SERVICES+=("${EXISTING_AI_SERVICES[@]}")
fi

# =====================
# Pull
# =====================
if [[ "${DO_PULL}" == "true" ]]; then
  print_status "Pulling images..."
  compose_cmd pull --ignore-pull-failures
fi

# =====================
# Build
# =====================
if [[ "${DO_BUILD}" == "true" && ${#EXISTING_BUILD_SERVICES[@]} -gt 0 ]]; then
  print_status "Building images..."
  compose_cmd build "${EXISTING_BUILD_SERVICES[@]}"
else
  print_status "Skipping build"
fi

# =====================
# Database
# =====================
print_status "Starting database and infrastructure services..."

compose_cmd up -d db rabbitmq seaweedfs

wait_for_healthy "postgres-db" 90
wait_for_healthy "rabbitmq" 90
wait_for_healthy "seaweedfs" 90

# =====================
# Migrations
# =====================
if service_exists "migration"; then
  run_one_shot "migration"
else
  print_warning "Migration service not found, skipping migrations"
fi

# =====================
# Umami DB bootstrap
# =====================
if service_exists "umami-db-init"; then
  run_one_shot "umami-db-init"
else
  print_warning "umami-db-init service not found, skipping Umami DB init"
fi

# =====================
# Deploy app services
# =====================
print_status "Deploying application services..."

compose_cmd up -d --remove-orphans "${EXISTING_PROJECT_SERVICES[@]}"

# =====================
# Verify services
# =====================
print_status "Verifying service health..."

wait_for_healthy "qualification-adapter" 90
wait_for_healthy "user-search-adapter" 90
wait_for_healthy "hr-backend" 120
wait_for_healthy "umami" 120

# =====================
# Umami bootstrap
# =====================
if [[ "${DO_UMAMI_BOOTSTRAP}" == "true" ]] && service_exists "umami-bootstrap"; then
  run_one_shot "umami-bootstrap"
else
  print_status "Skipping Umami website bootstrap"
fi

# =====================
# Final status
# =====================
print_status "Final Compose status:"
compose_cmd ps

# =====================
# Cleanup
# =====================
for service in "${ONE_SHOT_SERVICES[@]}"; do
  if service_exists "${service}"; then
    compose_cmd rm -f "${service}" >/dev/null 2>&1 || true
  fi
done

if [[ "${DO_PRUNE}" == "true" ]]; then
  print_status "Pruning unused Docker images..."
  docker image prune -f
else
  print_status "Skipping image prune. Use --prune to remove unused images."
fi

print_success "Deployment successful!"