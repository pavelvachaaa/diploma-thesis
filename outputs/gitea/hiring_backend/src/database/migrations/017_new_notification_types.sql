INSERT INTO notification_types (code, label, description, default_in_app_enabled, default_email_enabled) VALUES
  ('interview.scheduled',  'Naplánovaný pohovor', 'Oznámení o naplánování nového pohovoru',     true, false),
  ('interview.cancelled',  'Zrušený pohovor',     'Oznámení o zrušení pohovoru',                true, false),
  ('onboarding.completed', 'Onboarding dokončen', 'Oznámení o dokončení celého onboardingu',    true, true),
  ('document.approved',    'Dokument schválen',   'Oznámení o schválení nahraného dokumentu',   true, false),
  ('document.rejected',    'Dokument zamítnut',   'Oznámení o zamítnutí nahraného dokumentu',   true, false)
ON CONFLICT (code) DO NOTHING;
