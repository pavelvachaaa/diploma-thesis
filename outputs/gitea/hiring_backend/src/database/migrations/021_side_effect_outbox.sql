-- 021_side_effect_outbox.sql
-- Purpose: replace email_outbox + notification_outbox with one generic side_effect_outbox
--
-- Rollback instructions:
-- 1) Restore email_outbox / notification_outbox DDL from migrations 019 and 020.
-- 2) Backfill rows from side_effect_outbox by event_type prefixes.
-- 3) Drop side_effect_outbox.

CREATE TABLE IF NOT EXISTS side_effect_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(128) NOT NULL,
    idempotency_key TEXT UNIQUE,
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
    result_meta JSONB,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_side_effect_outbox_pending
    ON side_effect_outbox (status, available_at, created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_side_effect_outbox_processing_locked_at
    ON side_effect_outbox (status, locked_at)
    WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_side_effect_outbox_aggregate
    ON side_effect_outbox (aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_side_effect_outbox_request_id
    ON side_effect_outbox (request_id);

CREATE INDEX IF NOT EXISTS idx_side_effect_outbox_event_status
    ON side_effect_outbox (event_type, status, available_at);

-- Backfill only in-flight rows from legacy outboxes before drop.
INSERT INTO side_effect_outbox (
    event_type,
    idempotency_key,
    aggregate_type,
    aggregate_id,
    organization_id,
    request_id,
    payload,
    status,
    attempts,
    max_attempts,
    available_at,
    locked_at,
    locked_by,
    last_error,
    result_meta,
    sent_at,
    created_at,
    updated_at
)
SELECT
    eo.event_type,
    eo.dedupe_key,
    eo.aggregate_type,
    eo.aggregate_id,
    eo.organization_id,
    eo.request_id,
    eo.payload,
    CASE WHEN eo.status = 'processing' THEN 'pending' ELSE eo.status END,
    eo.attempts,
    eo.max_attempts,
    COALESCE(eo.available_at, NOW()),
    NULL,
    NULL,
    eo.last_error,
    CASE
        WHEN eo.provider_message_id IS NULL THEN NULL
        ELSE jsonb_build_object('providerMessageId', eo.provider_message_id)
    END,
    eo.sent_at,
    eo.created_at,
    eo.updated_at
FROM email_outbox eo
WHERE eo.status IN ('pending', 'processing')
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO side_effect_outbox (
    event_type,
    idempotency_key,
    aggregate_type,
    aggregate_id,
    organization_id,
    request_id,
    payload,
    status,
    attempts,
    max_attempts,
    available_at,
    locked_at,
    locked_by,
    last_error,
    result_meta,
    sent_at,
    created_at,
    updated_at
)
SELECT
    no.event_type,
    no.dedupe_key,
    no.aggregate_type,
    no.aggregate_id,
    no.organization_id,
    no.request_id,
    no.payload,
    CASE WHEN no.status = 'processing' THEN 'pending' ELSE no.status END,
    no.attempts,
    no.max_attempts,
    COALESCE(no.available_at, NOW()),
    NULL,
    NULL,
    no.last_error,
    NULL,
    no.sent_at,
    no.created_at,
    no.updated_at
FROM notification_outbox no
WHERE no.status IN ('pending', 'processing')
ON CONFLICT (idempotency_key) DO NOTHING;

DROP TABLE IF EXISTS email_outbox;
DROP TABLE IF EXISTS notification_outbox;

COMMENT ON TABLE side_effect_outbox IS 'Transactional outbox for asynchronous side effects (email, notifications, CV publish, etc.)';
