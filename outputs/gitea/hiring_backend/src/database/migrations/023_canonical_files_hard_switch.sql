-- 023_canonical_files_hard_switch.sql
-- Canonical file metadata table + hard switch owner tables to file_id foreign keys.
-- Rollback (manual): restore dropped columns and repopulate from files metadata snapshots/backups.

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_provider TEXT NOT NULL DEFAULT 's3',
    bucket TEXT NOT NULL,
    object_key TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    original_filename TEXT,
    checksum_sha256 TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    source_module TEXT NOT NULL,
    lifecycle_state TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active', 'retained', 'deleted', 'delete_failed')),
    retention_until TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bucket, object_key)
);

CREATE INDEX IF NOT EXISTS idx_files_lifecycle_retention
    ON files (lifecycle_state, retention_until);
CREATE INDEX IF NOT EXISTS idx_files_organization_id
    ON files (organization_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at
    ON files (created_at DESC);

CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_files_updated_at ON files;
CREATE TRIGGER trg_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_files_updated_at();

ALTER TABLE application_attachments ADD COLUMN IF NOT EXISTS file_id UUID;
ALTER TABLE direct_message_attachments ADD COLUMN IF NOT EXISTS file_id UUID;
ALTER TABLE interview_attachments ADD COLUMN IF NOT EXISTS file_id UUID;
ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS file_id UUID;
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS template_file_id UUID;
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS cv_file_id UUID;

-- Backfill files from existing owners.
INSERT INTO files (
    bucket,
    object_key,
    mime_type,
    size_bytes,
    original_filename,
    organization_id,
    uploaded_by,
    source_module,
    lifecycle_state,
    metadata
)
SELECT
    'attachments',
    aa.file_path,
    aa.mime_type,
    aa.file_size,
    aa.original_filename,
    a.organization_id,
    NULL,
    'applicants',
    'active',
    jsonb_build_object('owner_table', 'application_attachments', 'owner_id', aa.id)
FROM application_attachments aa
JOIN applicants a ON a.id = aa.applicant_id
WHERE aa.file_path IS NOT NULL
ON CONFLICT (bucket, object_key) DO NOTHING;

INSERT INTO files (
    bucket,
    object_key,
    mime_type,
    size_bytes,
    original_filename,
    organization_id,
    uploaded_by,
    source_module,
    lifecycle_state,
    metadata
)
SELECT
    'chat-files',
    dma.file_path,
    dma.mime_type,
    dma.file_size,
    dma.original_filename,
    sender.organization_id,
    dm.sender_id,
    'chat',
    'active',
    jsonb_build_object('owner_table', 'direct_message_attachments', 'owner_id', dma.id, 'message_id', dma.message_id)
FROM direct_message_attachments dma
JOIN direct_messages dm ON dm.id = dma.message_id
LEFT JOIN users sender ON sender.id = dm.sender_id
WHERE dma.file_path IS NOT NULL
ON CONFLICT (bucket, object_key) DO NOTHING;

INSERT INTO files (
    bucket,
    object_key,
    mime_type,
    size_bytes,
    original_filename,
    organization_id,
    uploaded_by,
    source_module,
    lifecycle_state,
    metadata
)
SELECT
    'attachments',
    ia.file_path,
    ia.mime_type,
    ia.file_size,
    ia.original_filename,
    ie.organization_id,
    ia.uploaded_by,
    'interviews',
    'active',
    jsonb_build_object('owner_table', 'interview_attachments', 'owner_id', ia.id, 'interview_id', ia.interview_id)
FROM interview_attachments ia
JOIN interview_events ie ON ie.id = ia.interview_id
WHERE ia.file_path IS NOT NULL
ON CONFLICT (bucket, object_key) DO NOTHING;

INSERT INTO files (
    bucket,
    object_key,
    mime_type,
    size_bytes,
    original_filename,
    organization_id,
    uploaded_by,
    source_module,
    lifecycle_state,
    metadata
)
SELECT
    'documents',
    ud.file_path,
    ud.mime_type,
    ud.file_size,
    ud.original_filename,
    u.organization_id,
    ud.user_id,
    'user_documents',
    'active',
    jsonb_build_object('owner_table', 'user_documents', 'owner_id', ud.id, 'document_id', ud.document_id)
FROM user_documents ud
JOIN users u ON u.id = ud.user_id
WHERE ud.file_path IS NOT NULL
ON CONFLICT (bucket, object_key) DO NOTHING;

INSERT INTO files (
    bucket,
    object_key,
    mime_type,
    size_bytes,
    original_filename,
    organization_id,
    uploaded_by,
    source_module,
    lifecycle_state,
    metadata
)
SELECT
    'templates',
    od.file_path,
    od.mime_type,
    od.file_size,
    od.file_name,
    od.organization_id,
    NULL,
    'onboarding_templates',
    'active',
    jsonb_build_object('owner_table', 'onboarding_documents', 'owner_id', od.id)
FROM onboarding_documents od
WHERE od.file_path IS NOT NULL
ON CONFLICT (bucket, object_key) DO NOTHING;

INSERT INTO files (
    bucket,
    object_key,
    mime_type,
    size_bytes,
    original_filename,
    organization_id,
    uploaded_by,
    source_module,
    lifecycle_state,
    metadata
)
SELECT
    'cv-uploads',
    js.cv_file_path,
    js.cv_mime_type,
    js.cv_file_size,
    js.cv_original_filename,
    js.organization_id,
    NULL,
    'job_seekers',
    'active',
    jsonb_build_object('owner_table', 'job_seekers', 'owner_id', js.id)
FROM job_seekers js
WHERE js.cv_file_path IS NOT NULL
ON CONFLICT (bucket, object_key) DO NOTHING;

-- Link owner rows to canonical files.
UPDATE application_attachments aa
SET file_id = f.id
FROM files f
WHERE aa.file_id IS NULL
  AND f.bucket = 'attachments'
  AND f.object_key = aa.file_path;

UPDATE direct_message_attachments dma
SET file_id = f.id
FROM files f
WHERE dma.file_id IS NULL
  AND f.bucket = 'chat-files'
  AND f.object_key = dma.file_path;

UPDATE interview_attachments ia
SET file_id = f.id
FROM files f
WHERE ia.file_id IS NULL
  AND f.bucket = 'attachments'
  AND f.object_key = ia.file_path;

UPDATE user_documents ud
SET file_id = f.id
FROM files f
WHERE ud.file_id IS NULL
  AND ud.file_path IS NOT NULL
  AND f.bucket = 'documents'
  AND f.object_key = ud.file_path;

UPDATE onboarding_documents od
SET template_file_id = f.id
FROM files f
WHERE od.template_file_id IS NULL
  AND od.file_path IS NOT NULL
  AND f.bucket = 'templates'
  AND f.object_key = od.file_path;

UPDATE job_seekers js
SET cv_file_id = f.id
FROM files f
WHERE js.cv_file_id IS NULL
  AND js.cv_file_path IS NOT NULL
  AND f.bucket = 'cv-uploads'
  AND f.object_key = js.cv_file_path;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM application_attachments) <> (SELECT COUNT(*) FROM application_attachments WHERE file_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Backfill failed: application_attachments row-count parity mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM direct_message_attachments) <> (SELECT COUNT(*) FROM direct_message_attachments WHERE file_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Backfill failed: direct_message_attachments row-count parity mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM interview_attachments) <> (SELECT COUNT(*) FROM interview_attachments WHERE file_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Backfill failed: interview_attachments row-count parity mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM user_documents WHERE file_path IS NOT NULL) <> (SELECT COUNT(*) FROM user_documents WHERE file_path IS NOT NULL AND file_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Backfill failed: user_documents uploaded row-count parity mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM onboarding_documents WHERE file_path IS NOT NULL) <> (SELECT COUNT(*) FROM onboarding_documents WHERE file_path IS NOT NULL AND template_file_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Backfill failed: onboarding_documents template row-count parity mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM job_seekers WHERE cv_file_path IS NOT NULL) <> (SELECT COUNT(*) FROM job_seekers WHERE cv_file_path IS NOT NULL AND cv_file_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Backfill failed: job_seekers CV row-count parity mismatch';
    END IF;

    IF EXISTS (SELECT 1 FROM application_attachments WHERE file_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill failed: application_attachments contains NULL file_id';
    END IF;

    IF EXISTS (SELECT 1 FROM direct_message_attachments WHERE file_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill failed: direct_message_attachments contains NULL file_id';
    END IF;

    IF EXISTS (SELECT 1 FROM interview_attachments WHERE file_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill failed: interview_attachments contains NULL file_id';
    END IF;

    IF EXISTS (SELECT 1 FROM user_documents WHERE file_path IS NOT NULL AND file_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill failed: user_documents has uploaded rows without file_id';
    END IF;

    IF EXISTS (SELECT 1 FROM onboarding_documents WHERE file_path IS NOT NULL AND template_file_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill failed: onboarding_documents has template file rows without template_file_id';
    END IF;

    IF EXISTS (SELECT 1 FROM job_seekers WHERE cv_file_path IS NOT NULL AND cv_file_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill failed: job_seekers has CV rows without cv_file_id';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM application_attachments aa
        LEFT JOIN files f ON f.id = aa.file_id
        WHERE aa.file_id IS NOT NULL
          AND f.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill failed: orphaned file references in application_attachments';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM direct_message_attachments dma
        LEFT JOIN files f ON f.id = dma.file_id
        WHERE dma.file_id IS NOT NULL
          AND f.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill failed: orphaned file references in direct_message_attachments';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM interview_attachments ia
        LEFT JOIN files f ON f.id = ia.file_id
        WHERE ia.file_id IS NOT NULL
          AND f.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill failed: orphaned file references in interview_attachments';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM user_documents ud
        LEFT JOIN files f ON f.id = ud.file_id
        WHERE ud.file_id IS NOT NULL
          AND f.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill failed: orphaned file references in user_documents';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM onboarding_documents od
        LEFT JOIN files f ON f.id = od.template_file_id
        WHERE od.template_file_id IS NOT NULL
          AND f.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill failed: orphaned file references in onboarding_documents';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM job_seekers js
        LEFT JOIN files f ON f.id = js.cv_file_id
        WHERE js.cv_file_id IS NOT NULL
          AND f.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill failed: orphaned file references in job_seekers';
    END IF;
END $$;

ALTER TABLE application_attachments ALTER COLUMN file_id SET NOT NULL;
ALTER TABLE direct_message_attachments ALTER COLUMN file_id SET NOT NULL;
ALTER TABLE interview_attachments ALTER COLUMN file_id SET NOT NULL;

ALTER TABLE application_attachments
    ADD CONSTRAINT application_attachments_file_id_fk
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE RESTRICT;
ALTER TABLE direct_message_attachments
    ADD CONSTRAINT direct_message_attachments_file_id_fk
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE RESTRICT;
ALTER TABLE interview_attachments
    ADD CONSTRAINT interview_attachments_file_id_fk
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE RESTRICT;
ALTER TABLE user_documents
    ADD CONSTRAINT user_documents_file_id_fk
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE RESTRICT;
ALTER TABLE onboarding_documents
    ADD CONSTRAINT onboarding_documents_template_file_id_fk
    FOREIGN KEY (template_file_id) REFERENCES files(id) ON DELETE RESTRICT;
ALTER TABLE job_seekers
    ADD CONSTRAINT job_seekers_cv_file_id_fk
    FOREIGN KEY (cv_file_id) REFERENCES files(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_application_attachments_file_id ON application_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_attachments_file_id ON direct_message_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_interview_attachments_file_id ON interview_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_file_id ON user_documents(file_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_template_file_id ON onboarding_documents(template_file_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_cv_file_id ON job_seekers(cv_file_id);

-- Remove duplicated per-owner file metadata.
ALTER TABLE application_attachments
    DROP COLUMN IF EXISTS file_path,
    DROP COLUMN IF EXISTS filename,
    DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS mime_type,
    DROP COLUMN IF EXISTS file_size;

ALTER TABLE direct_message_attachments
    DROP COLUMN IF EXISTS file_path,
    DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS mime_type,
    DROP COLUMN IF EXISTS file_size;

ALTER TABLE interview_attachments
    DROP COLUMN IF EXISTS file_path,
    DROP COLUMN IF EXISTS filename,
    DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS mime_type,
    DROP COLUMN IF EXISTS file_size;

ALTER TABLE user_documents
    DROP COLUMN IF EXISTS file_path,
    DROP COLUMN IF EXISTS filename,
    DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS mime_type,
    DROP COLUMN IF EXISTS file_size;

ALTER TABLE onboarding_documents
    DROP COLUMN IF EXISTS file_name,
    DROP COLUMN IF EXISTS file_path,
    DROP COLUMN IF EXISTS mime_type,
    DROP COLUMN IF EXISTS file_size;

ALTER TABLE job_seekers
    DROP COLUMN IF EXISTS cv_filename,
    DROP COLUMN IF EXISTS cv_original_filename,
    DROP COLUMN IF EXISTS cv_file_path,
    DROP COLUMN IF EXISTS cv_mime_type,
    DROP COLUMN IF EXISTS cv_file_size;
