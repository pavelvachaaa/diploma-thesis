-- 020_notification_outbox.sql
-- Purpose: transactional outbox for reliable asynchronous in-app notification delivery
--
-- Rollback instructions:
-- 1) DROP TABLE IF EXISTS notification_outbox;

CREATE TABLE IF NOT EXISTS notification_outbox (
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
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
    ON notification_outbox (status, available_at, created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_processing_locked_at
    ON notification_outbox (status, locked_at)
    WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_aggregate
    ON notification_outbox (aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_request_id
    ON notification_outbox (request_id);

COMMENT ON TABLE notification_outbox IS 'Transactional outbox for asynchronous, reliable in-app notification delivery';
