-- Cleanup failed stubs from previous attempts
DROP INDEX IF EXISTS idx_org_memberships_user_id;
DROP INDEX IF EXISTS idx_org_memberships_user_expires;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_org_memberships_org_id;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_memberships_user_id
    ON organization_memberships (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_memberships_user_expires
    ON organization_memberships (user_id, expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
    ON users (email) WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_memberships_org_id
    ON organization_memberships (organization_id);