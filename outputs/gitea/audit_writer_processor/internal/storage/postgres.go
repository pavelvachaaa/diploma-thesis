package storage

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"audit-writer-processor/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrMissingTable = errors.New("audit_events table does not exist")

// Writer persists audit events to PostgreSQL.
type Writer struct {
	pool *pgxpool.Pool
}

func NewWriter(ctx context.Context, postgresURL string) (*Writer, error) {
	pool, err := pgxpool.New(ctx, postgresURL)
	if err != nil {
		return nil, fmt.Errorf("create pg pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping pg: %w", err)
	}
	return &Writer{pool: pool}, nil
}

func (w *Writer) Close() {
	if w.pool != nil {
		w.pool.Close()
	}
}

func (w *Writer) EnsureSchema(ctx context.Context, autoCreate bool) error {
	var tableName *string
	err := w.pool.QueryRow(ctx, `SELECT to_regclass('public.audit_events')::text`).Scan(&tableName)
	if err != nil {
		return fmt.Errorf("check audit_events table: %w", err)
	}

	if tableName != nil && strings.TrimSpace(*tableName) != "" {
		return nil
	}

	if !autoCreate {
		return ErrMissingTable
	}

	ddl := `
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    request_id TEXT,
    source VARCHAR(32) NOT NULL DEFAULT 'api',
    category VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),

    actor_user_id UUID,
    actor_email TEXT,
    actor_roles TEXT[],
    organization_id UUID,

    method VARCHAR(16),
    path TEXT,
    resource_type VARCHAR(64),
    resource_id TEXT,
    target TEXT,
    status_code INTEGER,
    ip TEXT,
    user_agent TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    before_state JSONB,
    after_state JSONB,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_events_occurred_at ON audit_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_user_id ON audit_events (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_organization_id ON audit_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_request_id ON audit_events (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_category_action ON audit_events (category, action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_status ON audit_events (status);
`

	if _, err := w.pool.Exec(ctx, ddl); err != nil {
		return fmt.Errorf("create audit schema: %w", err)
	}

	return nil
}

func (w *Writer) InsertEvent(ctx context.Context, event *models.AuditEvent) error {
	if event == nil {
		return errors.New("nil audit event")
	}

	metadata := json.RawMessage(`{}`)
	if len(event.Metadata) > 0 {
		metadata = event.Metadata
	}

	const query = `
INSERT INTO audit_events (
    occurred_at, request_id, source, category, action, status,
    actor_user_id, actor_email, actor_roles, organization_id,
    method, path, resource_type, resource_id, target, status_code,
    ip, user_agent, metadata, before_state, after_state, error_message
) VALUES (
    COALESCE($1, NOW()), $2, $3, $4, $5, $6,
    NULLIF($7, '')::uuid, NULLIF($8, ''), $9, NULLIF($10, '')::uuid,
    NULLIF($11, ''), NULLIF($12, ''), NULLIF($13, ''), NULLIF($14, ''), NULLIF($15, ''), $16,
    NULLIF($17, ''), NULLIF($18, ''), $19::jsonb, $20::jsonb, $21::jsonb, NULLIF($22, '')
)
`

	_, err := w.pool.Exec(ctx, query,
		event.OccurredAt,
		event.RequestID,
		event.Source,
		event.Category,
		event.Action,
		event.Status,
		event.ActorUserID,
		event.ActorEmail,
		event.ActorRoles,
		event.OrganizationID,
		event.Method,
		event.Path,
		event.ResourceType,
		event.ResourceID,
		event.Target,
		event.StatusCode,
		event.IP,
		event.UserAgent,
		metadata,
		nullIfEmptyJSON(event.BeforeState),
		nullIfEmptyJSON(event.AfterState),
		event.ErrorMessage,
	)
	if err != nil {
		return fmt.Errorf("insert audit event: %w", err)
	}

	return nil
}

func nullIfEmptyJSON(raw json.RawMessage) any {
	if len(raw) == 0 {
		return nil
	}
	return raw
}
