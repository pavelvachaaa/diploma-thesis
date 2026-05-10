-- ===================================================================
-- Fix notification_types: replace underscore codes with dot-format codes
-- All application code uses dot-format (e.g. 'chat.message', 'user.created_from_applicant')
-- Migration 002 seeded wrong underscore-format codes causing FK violations on every INSERT
-- ===================================================================

-- Remove old wrong-coded rows
DELETE FROM notification_types
WHERE code IN ('employee_created', 'document_uploaded', 'onboarding_completed', 'chat_message');

-- Insert correct dot-format types (upsert to be safe if already partially fixed)
INSERT INTO notification_types (code, label, description, default_in_app_enabled, default_email_enabled) VALUES
  ('chat.message',                 'Nová zpráva',                  'Oznámení o nové zprávě v chatu',                             true,  false),
  ('user.created_from_applicant',  'Nový zaměstnanec',             'Oznámení o vytvoření nového zaměstnance',                    true,  true),
  ('document.uploaded',            'Nahraný dokument',             'Oznámení o nahrání nového dokumentu',                        true,  false),
  ('onboarding.step.completed',    'Krok onboardingu dokončen',    'Oznámení o dokončení kroku onboardingu zaměstnancem',        true,  false),
  ('job.application_received',     'Nová přihláška',               'Oznámení o nové přihlášce na pracovní pozici',               true,  true),
  ('applicant.status_changed',     'Změna stavu uchazeče',         'Oznámení o změně stavu uchazeče',                            true,  false),
  ('document.approval_required',   'Dokument ke schválení',        'Oznámení o dokumentu čekajícím na schválení',                true,  true)
ON CONFLICT (code) DO UPDATE SET
  label                    = EXCLUDED.label,
  description              = EXCLUDED.description,
  default_in_app_enabled   = EXCLUDED.default_in_app_enabled,
  default_email_enabled    = EXCLUDED.default_email_enabled;
