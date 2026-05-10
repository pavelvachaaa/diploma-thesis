-- 034_audit_events_historical_ids.sql
-- Keep audit_events append-only by removing parent FKs that would force ON DELETE mutations.
--
-- Rollback instructions:
-- 1) ALTER TABLE audit_events
--      ADD CONSTRAINT audit_events_actor_user_id_fkey
--      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
-- 2) ALTER TABLE audit_events
--      ADD CONSTRAINT audit_events_organization_id_fkey
--      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN unnest(c.conkey) AS key(attnum) ON true
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
        WHERE c.contype = 'f'
          AND n.nspname = 'public'
          AND t.relname = 'audit_events'
          AND a.attname IN ('actor_user_id', 'organization_id')
    LOOP
        EXECUTE format('ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END;
$$;
