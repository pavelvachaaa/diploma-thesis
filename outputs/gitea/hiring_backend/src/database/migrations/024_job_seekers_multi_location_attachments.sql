-- Week 31 feature cutover:
-- 1) Job seeker preferred locations move from single organization_id column to join table
-- 2) Job seekers can have up to 4 additional attachments in dedicated table
-- 3) AI readonly RLS scope for job_seekers follows mapped locations

CREATE TABLE IF NOT EXISTS job_seeker_locations (
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL CHECK (position > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (job_seeker_id, organization_id),
    CONSTRAINT uq_job_seeker_locations_position UNIQUE (job_seeker_id, position)
);

CREATE INDEX IF NOT EXISTS idx_job_seeker_locations_org ON job_seeker_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_locations_job_seeker ON job_seeker_locations(job_seeker_id);

CREATE TABLE IF NOT EXISTS job_seeker_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
    position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 4),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_job_seeker_attachments_position UNIQUE (job_seeker_id, position),
    CONSTRAINT uq_job_seeker_attachments_file UNIQUE (job_seeker_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_job_seeker_attachments_job_seeker ON job_seeker_attachments(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_attachments_file_id ON job_seeker_attachments(file_id);

INSERT INTO job_seeker_locations (job_seeker_id, organization_id, position)
SELECT js.id, js.organization_id, 1
FROM job_seekers js
WHERE js.organization_id IS NOT NULL
ON CONFLICT (job_seeker_id, organization_id) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM job_seekers js
        WHERE js.organization_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM job_seeker_locations jsl
            WHERE jsl.job_seeker_id = js.id
              AND jsl.organization_id = js.organization_id
        )
    ) THEN
        RAISE EXCEPTION 'Backfill failed: missing job_seeker_locations rows for existing job_seekers.organization_id values';
    END IF;
END
$$;

ALTER TABLE job_seekers
    DROP CONSTRAINT IF EXISTS job_seekers_organization_id_foreign;

DROP INDEX IF EXISTS idx_job_seekers_org;

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = current_schema()
          AND tablename = 'job_seekers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON job_seekers', policy_record.policyname);
    END LOOP;
END
$$;

ALTER TABLE job_seekers
    DROP COLUMN IF EXISTS organization_id CASCADE;

CREATE POLICY ai_org_filter ON job_seekers
FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR EXISTS (
        SELECT 1
        FROM job_seeker_locations jsl
        WHERE jsl.job_seeker_id = job_seekers.id
          AND jsl.organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
    )
);
