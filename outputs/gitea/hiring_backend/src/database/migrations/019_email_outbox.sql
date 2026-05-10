-- 019_email_outbox.sql
-- Purpose: transactional outbox for reliable asynchronous email delivery
--
-- Rollback instructions:
-- 1) DROP TABLE IF EXISTS email_outbox;

CREATE TABLE IF NOT EXISTS email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(128) NOT NULL,
    dedupe_key TEXT UNIQUE,
    aggregate_type VARCHAR(64),
    aggregate_id TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    request_id TEXT,
    payload JSONB NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'dead')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 10 CHECK (max_attempts > 0),

    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by TEXT,

    last_error TEXT,
    provider_message_id TEXT,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_pending
    ON email_outbox (status, available_at, created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_outbox_processing_locked_at
    ON email_outbox (status, locked_at)
    WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_email_outbox_aggregate
    ON email_outbox (aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_email_outbox_request_id
    ON email_outbox (request_id);

COMMENT ON TABLE email_outbox IS 'Transactional outbox for asynchronous, reliable email delivery';
