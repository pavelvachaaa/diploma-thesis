const {
    MEMBERSHIP_RULE_PREFIX,
    USER_ROLE_RULE_PREFIX,
    DIRECT_JOB_ASSIGNMENT_RULE
} = require('./constants');

module.exports = ({
    db,
    runInTransaction,
    dedupeIds
}) => {
    const syncJobPostingPermissions = async (jobPostingId, options = {}) => {
        const executor = options.client || null;
        const work = async (client) => {
            const result = await client.query(
                `SELECT id, organization_id
                 FROM job_postings
                 WHERE id = $1
                 LIMIT 1`,
                [jobPostingId]
            );

            await client.query(
                `DELETE FROM resource_permissions
                 WHERE resource_type = 'job_posting'
                   AND resource_id = $1
                   AND (
                       granted_by_rule LIKE $2
                       OR granted_by_rule LIKE $3
                   )`,
                [jobPostingId, `${MEMBERSHIP_RULE_PREFIX}%`, `${USER_ROLE_RULE_PREFIX}%`]
            );

            const job = result.rows[0];
            if (!job) {
                return { jobPostingId, deletedOnly: true };
            }

            await client.query(
                `WITH membership_targets AS (
                    SELECT
                        om.user_id,
                        om.id AS membership_id,
                        ur.name AS role_name
                    FROM organization_memberships om
                    JOIN users u ON u.id = om.user_id
                    JOIN user_roles ur ON ur.id = u.role_id
                    WHERE om.organization_id = $1
                      AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
                      AND ur.name IN ('hr', 'admin')
                ),
                super_admin_targets AS (
                    SELECT
                        u.id AS user_id
                    FROM users u
                    JOIN user_roles ur ON ur.id = u.role_id
                    WHERE ur.name = 'super_admin'
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
                    membership_targets.user_id,
                    'job_posting',
                    $2::uuid,
                    CASE membership_targets.role_name
                        WHEN 'hr' THEN 'write'::resource_access_level
                        ELSE 'admin'::resource_access_level
                    END,
                    $3 || membership_targets.membership_id::text,
                    NOW(),
                    NOW()
                FROM membership_targets
                UNION ALL
                SELECT
                    super_admin_targets.user_id,
                    'job_posting',
                    $2::uuid,
                    'admin'::resource_access_level,
                    $4 || super_admin_targets.user_id::text,
                    NOW(),
                    NOW()
                FROM super_admin_targets
                ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
                DO UPDATE SET
                    access_level = EXCLUDED.access_level,
                    updated_at = NOW()`,
                [job.organization_id, jobPostingId, MEMBERSHIP_RULE_PREFIX, USER_ROLE_RULE_PREFIX]
            );

            return { jobPostingId, organizationId: job.organization_id };
        };

        return executor ? work(executor) : runInTransaction(work, {
            label: 'rebac.syncJobPostingPermissions'
        });
    };

    const syncOrganizationPermissions = async (organizationId, options = {}) => {
        const executor = options.client || null;
        const work = async (client) => {
            const result = await client.query(
                `SELECT id
                 FROM organizations
                 WHERE id = $1
                 LIMIT 1`,
                [organizationId]
            );

            await client.query(
                `DELETE FROM resource_permissions
                 WHERE resource_type = 'organization'
                   AND resource_id = $1
                   AND (
                       granted_by_rule LIKE $2
                       OR granted_by_rule LIKE $3
                   )`,
                [organizationId, `${MEMBERSHIP_RULE_PREFIX}%`, `${USER_ROLE_RULE_PREFIX}%`]
            );

            const organization = result.rows[0];
            if (!organization) {
                return { organizationId, deletedOnly: true };
            }

            await client.query(
                `WITH membership_targets AS (
                    SELECT
                        om.user_id,
                        om.id AS membership_id,
                        ur.name AS role_name
                    FROM organization_memberships om
                    JOIN users u ON u.id = om.user_id
                    JOIN user_roles ur ON ur.id = u.role_id
                    WHERE om.organization_id = $1
                      AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
                      AND ur.name IN ('user', 'authorized_person', 'hr', 'admin')
                ),
                super_admin_targets AS (
                    SELECT
                        u.id AS user_id
                    FROM users u
                    JOIN user_roles ur ON ur.id = u.role_id
                    WHERE ur.name = 'super_admin'
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
                    membership_targets.user_id,
                    'organization',
                    $2::uuid,
                    CASE membership_targets.role_name
                        WHEN 'user' THEN 'read'::resource_access_level
                        WHEN 'authorized_person' THEN 'read'::resource_access_level
                        WHEN 'hr' THEN 'write'::resource_access_level
                        ELSE 'admin'::resource_access_level
                    END,
                    $3 || membership_targets.membership_id::text,
                    NOW(),
                    NOW()
                FROM membership_targets
                UNION ALL
                SELECT
                    super_admin_targets.user_id,
                    'organization',
                    $2::uuid,
                    'admin'::resource_access_level,
                    $4 || super_admin_targets.user_id::text,
                    NOW(),
                    NOW()
                FROM super_admin_targets
                ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
                DO UPDATE SET
                    access_level = EXCLUDED.access_level,
                    updated_at = NOW()`,
                [organizationId, organizationId, MEMBERSHIP_RULE_PREFIX, USER_ROLE_RULE_PREFIX]
            );

            return { organizationId };
        };

        return executor ? work(executor) : runInTransaction(work, {
            label: 'rebac.syncOrganizationPermissions'
        });
    };

    const replaceDirectJobAssignments = async (jobPostingId, userIds = [], options = {}) => {
        const executor = options.client || db;
        const normalizedUserIds = dedupeIds(userIds);

        if (normalizedUserIds.length > 0) {
            await executor.query(
                `DELETE FROM resource_permissions
                 WHERE resource_type = 'job_posting'
                   AND resource_id = $1
                   AND granted_by_rule = $2
                   AND user_id <> ALL($3::uuid[])`,
                [jobPostingId, DIRECT_JOB_ASSIGNMENT_RULE, normalizedUserIds]
            );
        } else {
            await executor.query(
                `DELETE FROM resource_permissions
                 WHERE resource_type = 'job_posting'
                   AND resource_id = $1
                   AND granted_by_rule = $2`,
                [jobPostingId, DIRECT_JOB_ASSIGNMENT_RULE]
            );
        }

        if (normalizedUserIds.length > 0) {
            await executor.query(
                `INSERT INTO resource_permissions (
                    user_id,
                    resource_type,
                    resource_id,
                    access_level,
                    granted_by_rule,
                    granted_at,
                    updated_at
                )
                SELECT
                    assigned_user_id,
                    'job_posting',
                    $1::uuid,
                    'read'::resource_access_level,
                    $2,
                    NOW(),
                    NOW()
                FROM unnest($3::uuid[]) AS assigned_user_id
                ON CONFLICT (user_id, resource_type, resource_id, granted_by_rule)
                DO UPDATE SET
                    access_level = EXCLUDED.access_level,
                    updated_at = NOW()`,
                [jobPostingId, DIRECT_JOB_ASSIGNMENT_RULE, normalizedUserIds]
            );
        }

        return normalizedUserIds;
    };

    const getDirectJobAssignments = async (jobPostingId, options = {}) => {
        const executor = options.client || db;
        const { rows } = await executor.query(
            `SELECT
                rp.user_id,
                u.id AS "localUserId",
                u.id AS "userId",
                u.name AS "name",
                u.surname AS "surname",
                CONCAT_WS(' ', u.name, u.surname) AS "fullName",
                LOWER(u.email) AS "email",
                u.organization_id AS "organizationId",
                o.name AS "organizationName",
                o.seat_location AS "seatLocation"
            FROM resource_permissions rp
            JOIN users u ON u.id = rp.user_id
            LEFT JOIN organizations o ON o.id = u.organization_id
            WHERE rp.resource_type = 'job_posting'
              AND rp.resource_id = $1
              AND rp.granted_by_rule = $2
            ORDER BY u.name, u.surname, u.email`,
            [jobPostingId, DIRECT_JOB_ASSIGNMENT_RULE]
        );

        return rows.map((row) => ({
            assignmentId: null,
            jobPostingId,
            assignedAt: null,
            assignedBy: null,
            ...row
        }));
    };

    return {
        syncJobPostingPermissions,
        syncOrganizationPermissions,
        replaceDirectJobAssignments,
        getDirectJobAssignments
    };
};
