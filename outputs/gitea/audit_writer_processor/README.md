# audit_writer_processor

Standalone Go worker that consumes audit events from RabbitMQ and persists them into PostgreSQL (`audit_events` table).

## Why this exists

- Keeps audit persistence outside request path in the API service
- Makes audit ingestion horizontally scalable and fault-tolerant
- Supports dead-lettering for poison messages

## Event flow

1. Producer publishes JSON event to exchange `audit_events` (routing key `audit.event` by default)
2. `audit_writer_processor` consumes and validates payload
3. Valid event is inserted into `audit_events`
4. Invalid/permanent-failure events are dead-lettered to `<queue>.dead`

## Payload contract

Required fields:

- `category` (string)
- `action` (string)

Optional fields:

- `status` (`success` | `failure`, default `success`)
- `request_id` / `requestId`
- `source`
- `actor_user_id` / `actorUserId`
- `actor_email` / `actorEmail`
- `actor_roles` / `actorRoles`
- `organization_id` / `organizationId`
- `method`, `path`
- `resource_type` / `resourceType`
- `resource_id` / `resourceId`
- `target`, `status_code`
- `ip` / `ipAddress`
- `user_agent` / `userAgent`
- `metadata` (json object)
- `before_state` / `beforeState` (json)
- `after_state` / `afterState` (json)
- `error_message` / `errorMessage`

Both `snake_case` and `camelCase` aliases are accepted for compatibility.

## Environment


- `RABBITMQ_URL`
- `AUDIT_EXCHANGE`, `AUDIT_QUEUE`, `AUDIT_ROUTING_KEY`
- `POSTGRES_URL`
- `AUDIT_AUTO_CREATE_TABLE` (`false` recommended when migrations are managed externally)

## Local run

```bash
go mod tidy
go run ./cmd/worker
```

## Docker run

```bash
docker compose up -d --build
```

## Notes

- If `audit_events` does not exist and `AUDIT_AUTO_CREATE_TABLE=false`, worker exits with clear error.
- Dead-letter queue is declared automatically as `<AUDIT_QUEUE>.dead`.
