-- Migration 026: add preferred position fields to job_seekers
-- Rollback:
--   DROP INDEX IF EXISTS idx_job_seekers_preferred_position_key;
--   ALTER TABLE job_seekers
--     DROP COLUMN IF EXISTS preferred_position_key,
--     DROP COLUMN IF EXISTS preferred_position_name;

ALTER TABLE job_seekers
    ADD COLUMN IF NOT EXISTS preferred_position_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS preferred_position_key VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_job_seekers_preferred_position_key
    ON job_seekers (preferred_position_key);
