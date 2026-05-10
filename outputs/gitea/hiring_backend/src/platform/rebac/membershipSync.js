const {
    MEMBERSHIP_RULE_PREFIX,
    USER_ROLE_RULE_PREFIX
} = require('./constants');

module.exports = ({
    db,
    runInTransaction,
    getMembershipRule,
    getUserRoleRule
}) => {
    const deleteMembershipRuleRows = async (membershipId, executor) => {
        await executor.query(
            `DELETE FROM resource_permissions
             WHERE granted_by_rule = $1`,
            [getMembershipRule(membershipId)]
        );
    };

    const deleteUserRoleRuleRows = async (userId, executor) => {
        await executor.query(
            `DELETE FROM resource_permissions
             WHERE granted_by_rule = $1`,
            [getUserRoleRule(userId)]
        );
    };

    const upsertOrganizationRowsForMembership = async (membershipId, executor) => {
        const rule = getMembershipRule(membershipId);
        await executor.query(
            `WITH membership AS (
                SELECT
                    om.id AS membership_id,
                    om.user_id,
                    om.organization_id,
                    ur.name AS role_name
                FROM organization_memberships om
                JOIN users u ON u.id = om.user_id
                JOIN user_roles ur ON ur.id = u.role_id
                WHERE om.id = $1
                  AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
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
                m.user_id,
                'organization',
                m.organization_id,
                CASE m.role_name
                    WHEN 'user' THEN 'read'::resource_access_level
                    WHEN 'authorized_person' THEN 'read'::resource_access_level
                    WHEN 'hr' THEN 'write'::resource_access_level
                    WHEN 'admin' THEN 'admin'::resource_access_level
                END AS access_level,
                $2,
                NOW(),
                NOW()
            FROM membership m
            WHERE m.role_name IN ('user', 'authorized_person', 'hr', 'admin')
            ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
            DO UPDATE SET
                access_level = EXCLUDED.access_level,
                updated_at = NOW()`,
            [membershipId, rule]
        );
    };

    const upsertJobRowsForMembership = async (membershipId, executor) => {
        const rule = getMembershipRule(membershipId);
        await executor.query(
            `WITH membership AS (
                SELECT
                    om.id AS membership_id,
                    om.user_id,
                    om.organization_id,
                    ur.name AS role_name
                FROM organization_memberships om
                JOIN users u ON u.id = om.user_id
                JOIN user_roles ur ON ur.id = u.role_id
                WHERE om.id = $1
                  AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
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
                m.user_id,
                'job_posting',
                jp.id,
                CASE m.role_name
                    WHEN 'hr' THEN 'write'::resource_access_level
                    WHEN 'admin' THEN 'admin'::resource_access_level
                END AS access_level,
                $2,
                NOW(),
                NOW()
            FROM membership m
            JOIN job_postings jp ON jp.organization_id = m.organization_id
            WHERE m.role_name IN ('hr', 'admin')
            ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
            DO UPDATE SET
                access_level = EXCLUDED.access_level,
                updated_at = NOW()`,
            [membershipId, rule]
        );
    };

    const upsertRowsForUserRole = async (userId, executor) => {
        const rule = getUserRoleRule(userId);
        await executor.query(
            `WITH actor AS (
                SELECT
                    u.id AS user_id,
                    ur.name AS role_name
                FROM users u
                JOIN user_roles ur ON ur.id = u.role_id
                WHERE u.id = $1
                LIMIT 1
            ),
            organization_acl AS (
                SELECT
                    actor.user_id,
                    'organization'::text AS resource_type,
                    o.id AS resource_id,
                    'admin'::resource_access_level AS access_level
                FROM actor
                JOIN organizations o ON actor.role_name = 'super_admin'
                WHERE actor.role_name = 'super_admin'
            ),
            job_posting_acl AS (
                SELECT
                    actor.user_id,
                    'job_posting'::text AS resource_type,
                    jp.id AS resource_id,
                    'admin'::resource_access_level AS access_level
                FROM actor
                JOIN job_postings jp ON actor.role_name = 'super_admin'
                WHERE actor.role_name = 'super_admin'
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
                acl.user_id,
                acl.resource_type,
                acl.resource_id,
                acl.access_level,
                $2,
                NOW(),
                NOW()
            FROM (
                SELECT * FROM organization_acl
                UNION ALL
                SELECT * FROM job_posting_acl
            ) acl
            ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
            DO UPDATE SET
                access_level = EXCLUDED.access_level,
                updated_at = NOW()`,
            [userId, rule]
        );
    };

    const getActiveMembershipIdsForUser = async (userId, executor) => {
        const { rows } = await executor.query(
            `SELECT om.id
             FROM organization_memberships om
             WHERE om.user_id = $1
               AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
             ORDER BY om.assigned_at DESC NULLS LAST, om.id`,
            [userId]
        );

        return rows.map((row) => row.id);
    };

    const syncMembershipPermissions = async (membershipId, options = {}) => {
        const executor = options.client || null;
        const work = async (client) => {
            await deleteMembershipRuleRows(membershipId, client);
            await upsertOrganizationRowsForMembership(membershipId, client);
            await upsertJobRowsForMembership(membershipId, client);
            return { membershipId };
        };

        return executor ? work(executor) : runInTransaction(work, {
            label: 'rebac.syncMembershipPermissions'
        });
    };

    const syncUserRolePermissions = async (userId, options = {}) => {
        const executor = options.client || null;
        const work = async (client) => {
            await deleteUserRoleRuleRows(userId, client);
            await upsertRowsForUserRole(userId, client);

            const membershipIds = await getActiveMembershipIdsForUser(userId, client);
            for (const membershipId of membershipIds) {
                await deleteMembershipRuleRows(membershipId, client);
                await upsertOrganizationRowsForMembership(membershipId, client);
                await upsertJobRowsForMembership(membershipId, client);
            }

            return {
                userId,
                membershipCount: membershipIds.length
            };
        };

        return executor ? work(executor) : runInTransaction(work, {
            label: 'rebac.syncUserRolePermissions'
        });
    };

    const deleteMembershipPermissions = async (membershipId, options = {}) => {
        const executor = options.client || db;
        await deleteMembershipRuleRows(membershipId, executor);
        return { membershipId };
    };

    const cleanupExpiredMembershipPermissions = async (options = {}) => {
        const executor = options.client || db;
        const { rowCount } = await executor.query(
            `DELETE FROM resource_permissions rp
             WHERE rp.granted_by_rule LIKE $1
               AND NOT EXISTS (
                   SELECT 1
                   FROM organization_memberships om
                   WHERE (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
                     AND $2 || om.id::text = rp.granted_by_rule
               )`,
            [`${MEMBERSHIP_RULE_PREFIX}%`, MEMBERSHIP_RULE_PREFIX]
        );

        return rowCount || 0;
    };

    const repairMembershipPermissions = async () => runInTransaction(async (client) => {
        await client.query(
            `DELETE FROM resource_permissions
             WHERE granted_by_rule LIKE $1
                OR granted_by_rule LIKE $2`,
            [`${MEMBERSHIP_RULE_PREFIX}%`, `${USER_ROLE_RULE_PREFIX}%`]
        );

        await client.query(
            `WITH active_memberships AS (
                SELECT
                    om.id AS membership_id,
                    om.user_id,
                    om.organization_id,
                    ur.name AS role_name
                FROM organization_memberships om
                JOIN users u ON u.id = om.user_id
                JOIN user_roles ur ON ur.id = u.role_id
                WHERE om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP
            ),
            organization_acl AS (
                SELECT
                    am.user_id,
                    'organization'::text AS resource_type,
                    am.organization_id AS resource_id,
                    CASE am.role_name
                        WHEN 'user' THEN 'read'::resource_access_level
                        WHEN 'authorized_person' THEN 'read'::resource_access_level
                        WHEN 'hr' THEN 'write'::resource_access_level
                        ELSE 'admin'::resource_access_level
                    END AS access_level,
                    $1 || am.membership_id::text AS granted_by_rule
                FROM active_memberships am
                WHERE am.role_name IN ('user', 'authorized_person', 'hr', 'admin')
            ),
            job_posting_acl AS (
                SELECT
                    am.user_id,
                    'job_posting'::text AS resource_type,
                    jp.id AS resource_id,
                    CASE am.role_name
                        WHEN 'hr' THEN 'write'::resource_access_level
                        ELSE 'admin'::resource_access_level
                    END AS access_level,
                    $1 || am.membership_id::text AS granted_by_rule
                FROM active_memberships am
                JOIN job_postings jp ON jp.organization_id = am.organization_id
                WHERE am.role_name IN ('hr', 'admin')
            ),
            super_admin_users AS (
                SELECT
                    u.id AS user_id
                FROM users u
                JOIN user_roles ur ON ur.id = u.role_id
                WHERE ur.name = 'super_admin'
            ),
            super_admin_org_acl AS (
                SELECT
                    sau.user_id,
                    'organization'::text AS resource_type,
                    o.id AS resource_id,
                    'admin'::resource_access_level AS access_level,
                    $2 || sau.user_id::text AS granted_by_rule
                FROM super_admin_users sau
                JOIN organizations o ON TRUE
            ),
            super_admin_job_acl AS (
                SELECT
                    sau.user_id,
                    'job_posting'::text AS resource_type,
                    jp.id AS resource_id,
                    'admin'::resource_access_level AS access_level,
                    $2 || sau.user_id::text AS granted_by_rule
                FROM super_admin_users sau
                JOIN job_postings jp ON TRUE
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
                acl.user_id,
                acl.resource_type,
                acl.resource_id,
                acl.access_level,
                acl.granted_by_rule,
                NOW(),
                NOW()
            FROM (
                SELECT * FROM organization_acl
                UNION ALL
                SELECT * FROM job_posting_acl
                UNION ALL
                SELECT * FROM super_admin_org_acl
                UNION ALL
                SELECT * FROM super_admin_job_acl
            ) acl`,
            [MEMBERSHIP_RULE_PREFIX, USER_ROLE_RULE_PREFIX]
        );
    }, { label: 'rebac.repairMembershipPermissions' });

    return {
        syncMembershipPermissions,
        syncUserRolePermissions,
        deleteMembershipPermissions,
        cleanupExpiredMembershipPermissions,
        repairMembershipPermissions
    };
};
