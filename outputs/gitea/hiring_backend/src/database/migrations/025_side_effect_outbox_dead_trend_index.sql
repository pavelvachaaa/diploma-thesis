-- 025_side_effect_outbox_dead_trend_index.sql
-- Purpose: optimize dead-letter trend/event queries used by operational tooling.
--
-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_side_effect_outbox_dead_updated_event;

CREATE INDEX IF NOT EXISTS idx_side_effect_outbox_dead_updated_event
    ON side_effect_outbox (updated_at DESC, event_type)
    WHERE status = 'dead';
