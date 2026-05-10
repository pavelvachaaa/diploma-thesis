-- 033_drop_organization_memberships_role_id.sql
-- Contract phase: organization_memberships now stores only organization access metadata.
-- Canonical global role lives in users.role_id.

ALTER TABLE organization_memberships
    DROP COLUMN IF EXISTS role_id;
