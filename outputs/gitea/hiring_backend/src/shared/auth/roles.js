const USER_ROLE = 'user';
const AUTHORIZED_PERSON_ROLE = 'authorized_person';
const HR_ROLE = 'hr';
const ADMIN_ROLE = 'admin';
const SUPER_ADMIN_ROLE = 'super_admin';

const ADMIN_HR_ROLES = [ADMIN_ROLE, HR_ROLE];
const ADMIN_HR_AUTHORIZED_PERSON_ROLES = [ADMIN_ROLE, HR_ROLE, AUTHORIZED_PERSON_ROLE];
const ADMIN_ONLY_ROLES = [ADMIN_ROLE];
const SUPER_ADMIN_ONLY_ROLES = [SUPER_ADMIN_ROLE];
const ELEVATED_ADMIN_ROLES = [SUPER_ADMIN_ROLE, ADMIN_ROLE, HR_ROLE];
const ADMIN_SHELL_ROLES = [...ELEVATED_ADMIN_ROLES, AUTHORIZED_PERSON_ROLE];
const ROLE_ASSIGNABLE_VALUES = [USER_ROLE, AUTHORIZED_PERSON_ROLE, HR_ROLE, ADMIN_ROLE];

const ROLE_LABELS = {
    [USER_ROLE]: 'zamestnanec',
    [AUTHORIZED_PERSON_ROLE]: 'opravnena osoba',
    [HR_ROLE]: 'HR',
    [ADMIN_ROLE]: 'administrator',
    [SUPER_ADMIN_ROLE]: 'super administrator'
};

const normalizeRoles = (roles = []) => (
    Array.isArray(roles)
        ? roles.map((role) => String(role || '').trim()).filter(Boolean)
        : []
);

const hasAnyRole = (roles = [], candidateRoles = []) => {
    const normalizedRoles = normalizeRoles(roles);
    const normalizedCandidates = new Set(normalizeRoles(candidateRoles));
    return normalizedRoles.some((role) => normalizedCandidates.has(role));
};

const isAuthorizedPersonOnly = (userOrRoles = []) => {
    const roles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles?.roles;
    const normalizedRoles = normalizeRoles(roles);
    return normalizedRoles.includes(AUTHORIZED_PERSON_ROLE)
        && !hasAnyRole(normalizedRoles, ELEVATED_ADMIN_ROLES);
};

module.exports = {
    USER_ROLE,
    AUTHORIZED_PERSON_ROLE,
    HR_ROLE,
    ADMIN_ROLE,
    SUPER_ADMIN_ROLE,
    ADMIN_HR_ROLES,
    ADMIN_HR_AUTHORIZED_PERSON_ROLES,
    ADMIN_ONLY_ROLES,
    SUPER_ADMIN_ONLY_ROLES,
    ELEVATED_ADMIN_ROLES,
    ADMIN_SHELL_ROLES,
    ROLE_ASSIGNABLE_VALUES,
    ROLE_LABELS,
    hasAnyRole,
    isAuthorizedPersonOnly
};
