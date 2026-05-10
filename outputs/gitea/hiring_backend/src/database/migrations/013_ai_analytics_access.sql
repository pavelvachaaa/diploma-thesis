-- Grant ai_readonly SELECT on analytics/history tables and enable RLS.
-- Rollback: REVOKE SELECT ON ... FROM ai_readonly; DROP POLICY ai_org_filter ON ...; ALTER TABLE ... DISABLE ROW LEVEL SECURITY;

-- Grant SELECT on new tables
GRANT SELECT ON
    applicant_status_history,
    interview_status_history,
    interview_participants,
    user_onboarding_steps,
    onboarding_steps,
    application_attachments,
    user_documents,
    document_statuses
TO ai_readonly;

-- RLS: onboarding_steps has direct organization_id
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON onboarding_steps FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR organization_id = ANY(string_to_array(current_setting('app.current_org_ids', true), ',')::uuid[])
);

-- RLS: applicant_status_history → filter via applicants (which already has RLS)
ALTER TABLE applicant_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON applicant_status_history FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR applicant_id IN (SELECT id FROM applicants)
);

-- RLS: interview_status_history → filter via interview_events (which already has RLS)
ALTER TABLE interview_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON interview_status_history FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR interview_id IN (SELECT id FROM interview_events)
);

-- RLS: interview_participants → filter via interview_events (which already has RLS)
ALTER TABLE interview_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON interview_participants FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR interview_id IN (SELECT id FROM interview_events)
);

-- RLS: user_onboarding_steps → filter via users (which already has RLS)
ALTER TABLE user_onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON user_onboarding_steps FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR user_id IN (SELECT id FROM users)
);

-- RLS: application_attachments → filter via applicants (which already has RLS)
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON application_attachments FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR applicant_id IN (SELECT id FROM applicants)
);

-- RLS: user_documents → filter via users (which already has RLS)
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_org_filter ON user_documents FOR SELECT TO ai_readonly
USING (
    current_setting('app.current_org_ids', true) IS NULL
    OR user_id IN (SELECT id FROM users)
);

-- document_statuses is a reference table — no RLS needed (no org-specific data)
