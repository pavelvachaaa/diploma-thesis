-- 018_audit_events.sql
-- Purpose: universal immutable audit trail for API, domain, and email events
--
-- Rollback instructions:
-- 1) DROP TRIGGER IF EXISTS trg_prevent_audit_events_mutation ON audit_events;
-- 2) DROP FUNCTION IF EXISTS prevent_audit_events_mutation();
-- 3) DROP TABLE IF EXISTS audit_events;

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    request_id TEXT,
    source VARCHAR(32) NOT NULL DEFAULT 'api',
    category VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),

    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_roles TEXT[],
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

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

COMMENT ON TABLE audit_events IS 'Immutable audit trail for API actions, entity changes, and integrations (e.g. email)';

CREATE OR REPLACE FUNCTION prevent_audit_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is immutable and append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_events_mutation ON audit_events;
CREATE TRIGGER trg_prevent_audit_events_mutation
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_events_mutation();
