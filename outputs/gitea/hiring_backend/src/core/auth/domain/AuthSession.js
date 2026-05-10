const { ensureRoles } = require('./roles');

const toDisplayName = (user = {}) => user.full_name || `${user.name || ''} ${user.surname || ''}`.trim();

const toOrganizationName = (user = {}) => user.organization_name || user.organization || null;

const toTokenPayload = (user = {}) => Object.freeze({
    id: user.id,
    email: user.email,
    full_name: toDisplayName(user),
    organization_id: user.organization_id || null,
    organization_name: toOrganizationName(user)
});

const toCurrentUser = (user = {}) => Object.freeze({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    organization: user.organization_name,
    role: user.role || user.role_name || ensureRoles(user.roles)[0],
    roles: ensureRoles(user.roles),
    organizationIds: Array.isArray(user.roleData)
        ? [...new Set(user.roleData.map((role) => role.organization_id).filter(Boolean))]
        : []
});

const toLoginUser = (user = {}, roles = []) => {
    const resolvedRoles = ensureRoles(Array.isArray(roles) && roles.length ? roles : user.roles);
    return Object.freeze({
        userId: user.id,
        email: user.email,
        fullName: toDisplayName(user),
        organization: toOrganizationName(user),
        role: resolvedRoles[0] || 'user',
        roles: resolvedRoles
    });
};

module.exports = {
    toCurrentUser,
    toDisplayName,
    toLoginUser,
    toOrganizationName,
    toTokenPayload
};
