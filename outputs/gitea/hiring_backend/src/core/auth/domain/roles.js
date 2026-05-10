const ELEVATED_ADMIN_ROLES = Object.freeze(['admin', 'hr', 'super_admin']);
const AUTHORIZED_PERSON_ROLE = 'authorized_person';

const ensureRoles = (roles = []) => (
    Array.isArray(roles) && roles.length > 0 ? roles : ['user']
);

const hasAnyRole = (roles = [], expected = []) => {
    const normalized = ensureRoles(roles);
    return expected.some((role) => normalized.includes(role));
};

const getRedirectForRoles = (roles = []) => {
    const normalized = ensureRoles(roles);
    if (hasAnyRole(normalized, ELEVATED_ADMIN_ROLES)) {
        return '/admin/dashboard';
    }
    if (normalized.includes(AUTHORIZED_PERSON_ROLE)) {
        return '/admin/jobs';
    }
    return '/employee/dashboard';
};

module.exports = {
    AUTHORIZED_PERSON_ROLE,
    ELEVATED_ADMIN_ROLES,
    ensureRoles,
    getRedirectForRoles,
    hasAnyRole
};
