-- 031_authorized_person_role.sql
-- Add the official authorized_person role and backfill organization/read ACL rows

INSERT INTO user_roles (id, name, description)
SELECT
    gen_random_uuid(),
    'authorized_person',
    'Opravnena osoba s pristupem jen ke schvalenym inzeratum a pohovorum'
WHERE NOT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE name = 'authorized_person'
);

WITH authorized_person_role AS (
    SELECT id
    FROM user_roles
    WHERE name = 'authorized_person'
    LIMIT 1
),
active_memberships AS (
    SELECT
        om.id AS membership_id,
        om.user_id,
        om.organization_id
    FROM organization_memberships om
    JOIN authorized_person_role apr ON apr.id = om.role_id
    WHERE om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP
)
INSERT INTO resource_permissions (
    user_id,
    resource_type,
    resource_id,
    access_level,
    granted_by_rule,
    granted_at,
    updated_at
)
SELECT
    am.user_id,
    'organization',
    am.organization_id,
    'read'::resource_access_level,
    'membership:' || am.membership_id::text,
    NOW(),
    NOW()
FROM active_memberships am
ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
DO UPDATE SET
    access_level = EXCLUDED.access_level,
    updated_at = NOW();
