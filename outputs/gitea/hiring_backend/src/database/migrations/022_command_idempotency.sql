-- 022_command_idempotency.sql
-- Tracks idempotent command execution results for retry-safe write endpoints.

CREATE TABLE IF NOT EXISTS command_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    response_status INTEGER,
    response_body JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_command_idempotency_scope_key
    ON command_idempotency (scope, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_command_idempotency_expires_at
    ON command_idempotency (expires_at);

CREATE INDEX IF NOT EXISTS idx_command_idempotency_status
    ON command_idempotency (status);

CREATE OR REPLACE FUNCTION update_command_idempotency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_command_idempotency_updated_at ON command_idempotency;
CREATE TRIGGER trg_command_idempotency_updated_at
    BEFORE UPDATE ON command_idempotency
    FOR EACH ROW
    EXECUTE FUNCTION update_command_idempotency_updated_at();

