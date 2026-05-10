-- 032_global_user_roles.sql
-- Move the canonical user role to users.role_id while keeping organization_memberships.role_id
-- temporarily for expand/contract rollout compatibility.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES user_roles(id);

DO $$
DECLARE
    conflicting_user_count integer;
    default_user_role_id uuid;
BEGIN
    SELECT COUNT(*)::integer
    INTO conflicting_user_count
    FROM (
        SELECT om.user_id
        FROM organization_memberships om
        JOIN user_roles ur ON ur.id = om.role_id
        WHERE (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
        GROUP BY om.user_id
        HAVING COUNT(DISTINCT ur.name) > 1
    ) conflicting_users;

    IF conflicting_user_count > 0 THEN
        RAISE EXCEPTION 'Cannot backfill users.role_id because % users have multiple active roles', conflicting_user_count;
    END IF;

    SELECT id
    INTO default_user_role_id
    FROM user_roles
    WHERE name = 'user'
    LIMIT 1;

    IF default_user_role_id IS NULL THEN
        RAISE EXCEPTION 'Cannot backfill users.role_id because role "user" does not exist';
    END IF;

    UPDATE users u
    SET role_id = COALESCE(
        (
            SELECT om.role_id
            FROM organization_memberships om
            WHERE om.user_id = u.id
              AND om.role_id IS NOT NULL
              AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
            ORDER BY om.assigned_at DESC NULLS LAST, om.id DESC
            LIMIT 1
        ),
        default_user_role_id
    )
    WHERE u.role_id IS NULL;
END $$;

ALTER TABLE users
ALTER COLUMN role_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);
