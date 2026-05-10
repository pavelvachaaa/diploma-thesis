-- 029_authorized_person_job_assignments.sql
-- Adds job-scoped authorized person assignments.

CREATE TABLE IF NOT EXISTS job_posting_authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT job_posting_authorized_users_job_user_unique UNIQUE (job_posting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_posting_authorized_users_job
    ON job_posting_authorized_users (job_posting_id);

CREATE INDEX IF NOT EXISTS idx_job_posting_authorized_users_user
    ON job_posting_authorized_users (user_id);
