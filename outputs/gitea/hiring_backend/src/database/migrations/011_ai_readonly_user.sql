-- Create read-only role for AI data queries
-- Rollback: DROP ROLE IF EXISTS ai_readonly;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ai_readonly') THEN
        CREATE ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_password';
    END IF;
END
$$;

-- Grant read-only access to relevant tables
GRANT USAGE ON SCHEMA public TO ai_readonly;
GRANT SELECT ON organizations, applicants, job_postings, job_roles,
    job_role_classifications, job_posting_statuses,
    interview_events, users, user_onboarding_progress, onboarding_workflows,
    application_statuses, contract_types, job_seekers
TO ai_readonly;
