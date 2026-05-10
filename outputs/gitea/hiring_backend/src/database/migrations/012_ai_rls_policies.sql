-- Enable Row Level Security on data tables for ai_readonly role.
-- Organization filtering is enforced via session variable app.current_org_ids.
-- Reference tables (organizations, application_statuses, contract_types) are NOT filtered.
-- Rollback: DROP POLICY IF EXISTS ai_org_filter ON <table>; ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;

-- Helper: RLS policies check current_setting('app.current_org_ids', true).
-- When NULL (super admin / not set), all rows are visible.
-- When set, only rows matching the comma-separated UUIDs are visible.

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON applicants FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON job_postings FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON job_roles FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

ALTER TABLE interview_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON interview_events FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON users FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON onboarding_workflows FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON job_seekers FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);
