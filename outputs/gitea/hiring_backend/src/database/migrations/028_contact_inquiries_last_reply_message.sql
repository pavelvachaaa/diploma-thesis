-- Migration 028: store last reply message for contact inquiries
-- Rollback:
--   ALTER TABLE contact_inquiries DROP COLUMN IF EXISTS last_reply_message;

ALTER TABLE contact_inquiries
    ADD COLUMN IF NOT EXISTS last_reply_message TEXT;
