-- Migration 027: contact inquiries inbox
-- Rollback:
--   DROP INDEX IF EXISTS idx_contact_inquiries_last_replied_at;
--   DROP INDEX IF EXISTS idx_contact_inquiries_email;
--   DROP INDEX IF EXISTS idx_contact_inquiries_submitted;
--   DROP TABLE IF EXISTS contact_inquiries;

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    message TEXT NOT NULL,
    gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_replied_at TIMESTAMPTZ,
    last_replied_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_reply_subject VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_submitted
    ON contact_inquiries (submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email
    ON contact_inquiries (email);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_last_replied_at
    ON contact_inquiries (last_replied_at DESC);
