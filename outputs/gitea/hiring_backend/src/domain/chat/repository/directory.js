module.exports = ({ db }) => {
    const getHRUsersByOrganization = async (organizationId, excludeUserId) => {
        const query = `
            SELECT
                u.id,
                u.name,
                u.surname,
                u.email,
                o.name as organization_name
            FROM users u
            JOIN organization_memberships om
              ON om.user_id = u.id
             AND om.organization_id = $1
             AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
            JOIN user_roles ur ON ur.id = u.role_id
            LEFT JOIN organizations o ON u.organization_id = o.id
            WHERE ur.name IN ('admin', 'hr', 'authorized_person')
              AND u.is_active = true
              AND u.id != $2
            ORDER BY u.name, u.surname
        `;

        const result = await db.query(query, [organizationId, excludeUserId]);
        return result.rows;
    };

    const getUsersByOrganizationScope = async ({
        organizationIds = [],
        excludeUserId = null,
        allowedRoles = null,
        includeAllOrganizations = false
    } = {}) => {
        const scopedOrganizationIds = Array.isArray(organizationIds)
            ? organizationIds.filter(Boolean)
            : [];

        if (!scopedOrganizationIds.length && !includeAllOrganizations) {
            return [];
        }

        const scopeClause = includeAllOrganizations
            ? ''
            : `
                  AND (
                      EXISTS (
                          SELECT 1
                          FROM organization_memberships om_scope
                          WHERE om_scope.user_id = u.id
                            AND om_scope.organization_id = ANY($1::uuid[])
                            AND (om_scope.expires_at IS NULL OR om_scope.expires_at > CURRENT_TIMESTAMP)
                      )
                      OR EXISTS (
                          SELECT 1
                          FROM resource_permissions rp_scope
                          JOIN job_postings jp_scope ON jp_scope.id = rp_scope.resource_id
                          WHERE rp_scope.user_id = u.id
                            AND rp_scope.resource_type = 'job_posting'
                            AND rp_scope.granted_by_rule = 'direct_job_assignment'
                            AND jp_scope.organization_id = ANY($1::uuid[])
                      )
                  )`;

        const query = `
            WITH scoped_users AS (
                SELECT DISTINCT
                    u.id,
                    u.name,
                    u.surname,
                    u.email,
                    u.organization_id,
                    o.name AS organization_name,
                    COALESCE(
                        ARRAY[primary_role.name::text],
                        ARRAY[]::text[]
                    ) AS roles
                FROM users u
                LEFT JOIN organizations o ON o.id = u.organization_id
                LEFT JOIN user_roles primary_role ON primary_role.id = u.role_id
                WHERE u.is_active = true
                  AND ($2::uuid IS NULL OR u.id <> $2::uuid)
                  ${scopeClause}
            )
            SELECT
                id,
                name,
                surname,
                email,
                organization_id,
                organization_name,
                roles
            FROM scoped_users
            WHERE (
                $3::text[] IS NULL
                OR roles && $3::text[]
            )
            ORDER BY name, surname, email
        `;

        const result = await db.query(query, [
            scopedOrganizationIds,
            excludeUserId || null,
            Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : null
        ]);

        return result.rows;
    };

    const getAuthorizedUsersBySharedJobs = async ({ currentUserId }) => {
        const query = `
            SELECT DISTINCT
                u.id,
                u.name,
                u.surname,
                u.email,
                u.organization_id,
                o.name AS organization_name,
                COALESCE(
                    ARRAY[primary_role.name::text],
                    ARRAY[]::text[]
                ) AS roles
            FROM resource_permissions self_assignment
            JOIN resource_permissions peer_assignment
              ON peer_assignment.resource_type = self_assignment.resource_type
             AND peer_assignment.resource_id = self_assignment.resource_id
             AND peer_assignment.granted_by_rule = 'direct_job_assignment'
             AND peer_assignment.user_id <> self_assignment.user_id
            JOIN users u ON u.id = peer_assignment.user_id
            LEFT JOIN user_roles primary_role ON primary_role.id = u.role_id
            LEFT JOIN organizations o ON o.id = u.organization_id
            WHERE self_assignment.user_id = $1
              AND self_assignment.resource_type = 'job_posting'
              AND self_assignment.granted_by_rule = 'direct_job_assignment'
              AND u.is_active = true
            ORDER BY u.name, u.surname, u.email
        `;

        const result = await db.query(query, [currentUserId]);
        return result.rows;
    };

    return {
        getHRUsersByOrganization,
        getUsersByOrganizationScope,
        getAuthorizedUsersBySharedJobs
    };
};
