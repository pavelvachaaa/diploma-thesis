const HttpError = require('@shared/errors/HttpError');

module.exports = ({ db }) => {
    const ensureMembershipCreateAccess = async ({
        actorUserId,
        organizationId,
        allowedRoles = []
    }, options = {}) => {
        if (!actorUserId) {
            throw new HttpError('Přihlášení je povinné', 401);
        }

        if (!organizationId) {
            throw new HttpError('Organizace je povinná', 400);
        }

        const normalizedRoles = [...new Set(
            (Array.isArray(allowedRoles) ? allowedRoles : [])
                .map((role) => String(role || '').trim().toLowerCase())
                .filter(Boolean)
        )];

        if (normalizedRoles.length === 0) {
            throw new Error('allowedRoles must not be empty');
        }

        const executor = options.client || db;
        const { rows } = await executor.query(
            `SELECT 1
             FROM users u
             JOIN user_roles ur ON ur.id = u.role_id
             WHERE u.id = $1
               AND (
                   ur.name = 'super_admin'
                   OR (
                       ur.name = ANY($3::text[])
                       AND EXISTS (
                           SELECT 1
                           FROM organization_memberships om
                           WHERE om.user_id = u.id
                             AND om.organization_id = $2
                             AND (om.expires_at IS NULL OR om.expires_at > CURRENT_TIMESTAMP)
                       )
                   )
               )
             LIMIT 1`,
            [actorUserId, organizationId, normalizedRoles]
        );

        if (rows.length === 0) {
            throw new HttpError('Nemáte oprávnění vytvořit zdroj v této organizaci', 403);
        }

        return true;
    };

    return {
        ensureMembershipCreateAccess
    };
};
