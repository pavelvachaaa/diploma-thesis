-- Migration 015: Convert contract_type_code to text[] to allow multiple contract types per job posting
-- Rollback: DROP VIEW job_postings_with_status; ALTER TABLE job_postings ALTER COLUMN contract_type_code TYPE text USING contract_type_code[1]; CREATE VIEW job_postings_with_status AS ...

-- Drop dependent view first
DROP VIEW IF EXISTS job_postings_with_status;

-- Drop FK constraint if exists
ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS job_postings_contract_type_code_foreign;

-- Convert column from text to text[] (wrap existing single values in an array)
ALTER TABLE job_postings
  ALTER COLUMN contract_type_code TYPE text[]
  USING CASE
    WHEN contract_type_code IS NULL OR contract_type_code = '' THEN NULL
    ELSE ARRAY[contract_type_code]
  END;

-- Remove 'contractor' from contract_types (dohoda není typ úvazku)
DELETE FROM contract_types WHERE code = 'contractor';

-- Add GIN index for efficient array containment queries
CREATE INDEX IF NOT EXISTS idx_job_postings_contract_type_codes ON job_postings USING GIN (contract_type_code);

-- Recreate the view (contract_type_code is now text[])
CREATE VIEW job_postings_with_status AS
SELECT
  id,
  title,
  description,
  job_role_id,
  onboarding_workflow_id,
  organization_id,
  status AS base_status,
  CASE
    WHEN status != 'active' THEN status
    WHEN expire_date IS NOT NULL AND expire_date < current_date THEN 'expired'
    ELSE status
  END AS status,
  salary_min,
  salary_max,
  short_description,
  contract_type_code,
  department,
  is_department_accredited,
  publish_date,
  expire_date,
  contact_email,
  contact_phone,
  cv_required,
  created_by,
  created_at
FROM job_postings;

ALTER VIEW job_postings_with_status OWNER TO admin;
