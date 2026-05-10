-- 030_rebac_permissions_cutover.sql
-- Purpose: replace organization/RLS/job-assignment authorization with explicit ReBAC ACL rows.
--
-- Rollback (manual, partial):
-- 1) Restore ai_readonly role and RLS policies from migrations 011, 012, 013 and 024 if needed.
-- 2) Restore job_posting_authorized_users from migration 029 if needed.
-- 3) Drop resource_permissions, helper function and cleanup triggers.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'resource_access_level'
    ) THEN
        CREATE TYPE resource_access_level AS ENUM ('read', 'write', 'admin');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS resource_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('organization', 'job_posting')),
    resource_id UUID NOT NULL,
    access_level resource_access_level NOT NULL,
    granted_by_rule TEXT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_type, resource_id, granted_by_rule)
);

CREATE INDEX IF NOT EXISTS idx_resource_permissions_actor_select
    ON resource_permissions (user_id, resource_type, access_level, resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_permissions_actor_exists
    ON resource_permissions (user_id, resource_type, resource_id, access_level);

CREATE INDEX IF NOT EXISTS idx_resource_permissions_resource
    ON resource_permissions (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_permissions_rule
    ON resource_permissions (granted_by_rule);

CREATE OR REPLACE FUNCTION cleanup_resource_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM resource_permissions
    WHERE resource_type = TG_ARGV[0]
      AND resource_id = OLD.id;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_resource_permissions_on_organizations ON organizations;
CREATE TRIGGER trg_cleanup_resource_permissions_on_organizations
AFTER DELETE ON organizations
FOR EACH ROW
EXECUTE FUNCTION cleanup_resource_permissions('organization');

DROP TRIGGER IF EXISTS trg_cleanup_resource_permissions_on_job_postings ON job_postings;
CREATE TRIGGER trg_cleanup_resource_permissions_on_job_postings
AFTER DELETE ON job_postings
FOR EACH ROW
EXECUTE FUNCTION cleanup_resource_permissions('job_posting');

WITH active_memberships AS (
    SELECT
        om.id AS membership_id,
        om.user_id,
        om.organization_id,
        ur.name AS role_name
    FROM organization_memberships om
    JOIN user_roles ur ON ur.id = om.role_id
    WHERE om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP
),
organization_acl AS (
    SELECT
        am.user_id,
        'organization'::text AS resource_type,
        CASE
            WHEN am.role_name = 'super_admin' THEN o.id
            ELSE am.organization_id
        END AS resource_id,
        CASE am.role_name
            WHEN 'user' THEN 'read'::resource_access_level
            WHEN 'hr' THEN 'write'::resource_access_level
            ELSE 'admin'::resource_access_level
        END AS access_level,
        'membership:' || am.membership_id::text AS granted_by_rule
    FROM active_memberships am
    JOIN organizations o
      ON am.role_name = 'super_admin'
      OR o.id = am.organization_id
    WHERE am.role_name IN ('user', 'hr', 'admin', 'super_admin')
),
job_posting_acl AS (
    SELECT
        am.user_id,
        'job_posting'::text AS resource_type,
        jp.id AS resource_id,
        CASE am.role_name
            WHEN 'hr' THEN 'write'::resource_access_level
            ELSE 'admin'::resource_access_level
        END AS access_level,
        'membership:' || am.membership_id::text AS granted_by_rule
    FROM active_memberships am
    JOIN job_postings jp
      ON am.role_name = 'super_admin'
      OR jp.organization_id = am.organization_id
    WHERE am.role_name IN ('hr', 'admin', 'super_admin')
)
INSERT INTO resource_permissions (
    user_id,
    resource_type,
    resource_id,
    access_level,
    granted_by_rule,
    granted_at,
    updated_at
)
SELECT
    acl.user_id,
    acl.resource_type,
    acl.resource_id,
    acl.access_level,
    acl.granted_by_rule,
    NOW(),
    NOW()
FROM (
    SELECT * FROM organization_acl
    UNION ALL
    SELECT * FROM job_posting_acl
) acl
ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
DO UPDATE SET
    access_level = EXCLUDED.access_level,
    updated_at = NOW();

INSERT INTO resource_permissions (
    user_id,
    resource_type,
    resource_id,
    access_level,
    granted_by_rule,
    granted_at,
    updated_at
)
SELECT
    jpau.user_id,
    'job_posting',
    jpau.job_posting_id,
    'read'::resource_access_level,
    'direct_job_assignment',
    COALESCE(jpau.assigned_at, NOW()),
    NOW()
FROM job_posting_authorized_users jpau
ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
DO UPDATE SET
    access_level = EXCLUDED.access_level,
    updated_at = NOW();

DROP POLICY IF EXISTS ai_org_filter ON applicants;
ALTER TABLE applicants DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON job_postings;
ALTER TABLE job_postings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON job_roles;
ALTER TABLE job_roles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON interview_events;
ALTER TABLE interview_events DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON users;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON onboarding_workflows;
ALTER TABLE onboarding_workflows DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON job_seekers;
ALTER TABLE job_seekers DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON onboarding_steps;
ALTER TABLE onboarding_steps DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON applicant_status_history;
ALTER TABLE applicant_status_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON interview_status_history;
ALTER TABLE interview_status_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON interview_participants;
ALTER TABLE interview_participants DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON user_onboarding_steps;
ALTER TABLE user_onboarding_steps DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON application_attachments;
ALTER TABLE application_attachments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_org_filter ON user_documents;
ALTER TABLE user_documents DISABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON applicants FROM ai_readonly;
REVOKE ALL PRIVILEGES ON job_postings FROM ai_readonly;
REVOKE ALL PRIVILEGES ON job_roles FROM ai_readonly;
REVOKE ALL PRIVILEGES ON interview_events FROM ai_readonly;
REVOKE ALL PRIVILEGES ON users FROM ai_readonly;
REVOKE ALL PRIVILEGES ON onboarding_workflows FROM ai_readonly;
REVOKE ALL PRIVILEGES ON job_seekers FROM ai_readonly;
REVOKE ALL PRIVILEGES ON onboarding_steps FROM ai_readonly;
REVOKE ALL PRIVILEGES ON applicant_status_history FROM ai_readonly;
REVOKE ALL PRIVILEGES ON interview_status_history FROM ai_readonly;
REVOKE ALL PRIVILEGES ON interview_participants FROM ai_readonly;
REVOKE ALL PRIVILEGES ON user_onboarding_steps FROM ai_readonly;
REVOKE ALL PRIVILEGES ON application_attachments FROM ai_readonly;
REVOKE ALL PRIVILEGES ON user_documents FROM ai_readonly;
REVOKE ALL PRIVILEGES ON document_statuses FROM ai_readonly;
REVOKE ALL PRIVILEGES ON organizations FROM ai_readonly;
REVOKE ALL PRIVILEGES ON job_role_classifications FROM ai_readonly;
REVOKE ALL PRIVILEGES ON job_posting_statuses FROM ai_readonly;
REVOKE ALL PRIVILEGES ON user_onboarding_progress FROM ai_readonly;
REVOKE ALL PRIVILEGES ON application_statuses FROM ai_readonly;
REVOKE ALL PRIVILEGES ON contract_types FROM ai_readonly;
REVOKE ALL PRIVILEGES ON files FROM ai_readonly;
REVOKE USAGE ON SCHEMA public FROM ai_readonly;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'ai_readonly'
    ) THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ai_readonly;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ai_readonly;
        REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM ai_readonly;
        REVOKE ALL PRIVILEGES ON SCHEMA public FROM ai_readonly;
        DROP OWNED BY ai_readonly;
        DROP ROLE ai_readonly;
    END IF;
END
$$;

DROP TABLE IF EXISTS job_posting_authorized_users;

COMMENT ON TABLE resource_permissions IS 'Explicit ReBAC permissions for top-level organization and job_posting resources.';
COMMENT ON COLUMN resource_permissions.granted_by_rule IS 'Deterministic grant source key: membership:<membership_id> or direct_job_assignment.';
