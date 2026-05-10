-- Add HR contact fields to organizations and backfill known hospital contacts.
-- Rollback:
--   ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_contact_photo_file_id_foreign;
--   DROP INDEX IF EXISTS idx_organizations_contact_photo_file_id;
--   ALTER TABLE organizations
--     DROP COLUMN IF EXISTS contact_photo_file_id,
--     DROP COLUMN IF EXISTS contact_linkedin_url,
--     DROP COLUMN IF EXISTS contact_phone,
--     DROP COLUMN IF EXISTS contact_name;

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS contact_photo_file_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organizations_contact_photo_file_id_foreign'
    ) THEN
        ALTER TABLE organizations
            ADD CONSTRAINT organizations_contact_photo_file_id_foreign
            FOREIGN KEY (contact_photo_file_id) REFERENCES files(id) ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_organizations_contact_photo_file_id
    ON organizations(contact_photo_file_id);

UPDATE organizations
SET
    contact_email = CASE seat_location
        WHEN 'CV' THEN 'hr.chomutov@kzcr.eu'
        WHEN 'MO' THEN 'hr.most@kzcr.eu'
        WHEN 'TP' THEN 'hr.teplice@kzcr.eu'
        WHEN 'UL' THEN 'hr.usti@kzcr.eu'
        WHEN 'DC' THEN 'hr.decin@kzcr.eu'
        WHEN 'RB' THEN 'hr.rumburk@kzcr.eu'
        WHEN 'LT' THEN 'hr.litomerice@kzcr.eu'
        ELSE contact_email
    END,
    contact_phone = CASE seat_location
        WHEN 'CV' THEN '723 191530'
        WHEN 'MO' THEN '608 000 466'
        WHEN 'TP' THEN '734 120 477'
        WHEN 'UL' THEN '705 777 934'
        WHEN 'DC' THEN '775 227 745'
        WHEN 'RB' THEN '705 564 726'
        WHEN 'LT' THEN '793 979 780'
        ELSE contact_phone
    END,
    contact_name = CASE seat_location
        WHEN 'CV' THEN 'Blaščáková Eliška'
        WHEN 'MO' THEN 'Hlinka David'
        WHEN 'TP' THEN 'Vavřincová Kateřina'
        WHEN 'UL' THEN 'Michovská Barbora'
        WHEN 'DC' THEN 'Milerová Jana'
        WHEN 'RB' THEN 'Stojanová Tereza'
        WHEN 'LT' THEN 'Novák Vlastimil'
        ELSE contact_name
    END
WHERE seat_location IN ('CV', 'MO', 'TP', 'UL', 'DC', 'RB', 'LT');
