const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const {
    ROLE_ASSIGNABLE_VALUES,
    SUPER_ADMIN_ROLE
} = require('@shared/auth/roles');

const isSuperAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes(SUPER_ADMIN_ROLE);
const isAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('admin');
const isAdminLike = (user) => isSuperAdmin(user) || isAdmin(user);

const fail = (message, code) => {
    throw new ApplicationError(message, { code });
};

const ensureCanViewUser = (requestingUser, userId, message) => {
    if (!isAdminLike(requestingUser) && requestingUser?.id !== userId) {
        fail(message, ErrorCode.FORBIDDEN);
    }
};

const ensureCanManageAssignments = (requestingUser) => {
    if (!isAdminLike(requestingUser)) {
        fail('Pouze administrátoři mohou spravovat role a přístupy do organizací', ErrorCode.FORBIDDEN);
    }
};

const ensureOrganizationWriteAccess = (requestingUser, organizationId) => {
    if (isSuperAdmin(requestingUser)) {
        return;
    }

    const organizationIds = Array.isArray(requestingUser?.organizations)
        ? requestingUser.organizations
        : [];

    if (!organizationId || !organizationIds.includes(organizationId)) {
        fail('Můžete upravovat přístupy pouze ve svých organizacích', ErrorCode.FORBIDDEN);
    }
};

const ensureExpirationIsFuture = (expiresAt) => {
    if (!expiresAt) {
        return;
    }

    const expiration = new Date(expiresAt);
    if (Number.isNaN(expiration.getTime()) || expiration <= new Date()) {
        fail('Datum expirace musí být v budoucnosti', ErrorCode.VALIDATION_ERROR);
    }
};

const getAssignableRoles = (requestingUser) => (
    isSuperAdmin(requestingUser)
        ? [...ROLE_ASSIGNABLE_VALUES, SUPER_ADMIN_ROLE]
        : ROLE_ASSIGNABLE_VALUES
);

const ensureRoleIsAssignable = (role, requestingUser) => {
    const validRoles = getAssignableRoles(requestingUser);

    if (!validRoles.includes(role)) {
        fail(`Neplatná role. Musí být jedna z: ${validRoles.join(', ')}`, ErrorCode.VALIDATION_ERROR);
    }
};

const ensureUserRoleExists = (targetRole) => {
    if (!targetRole) {
        fail('Uživatel nebyl nalezen', ErrorCode.NOT_FOUND);
    }
};

const ensureTargetSuperAdminIsProtected = (targetRole, requestingUser) => {
    ensureUserRoleExists(targetRole);

    if (targetRole.role_name === SUPER_ADMIN_ROLE && !isSuperAdmin(requestingUser)) {
        fail('Nemáte oprávnění upravovat super administrátora', ErrorCode.FORBIDDEN);
    }
};

const ensureMembershipExists = (membership) => {
    if (!membership) {
        fail('Přístup do organizace nebyl nalezen', ErrorCode.NOT_FOUND);
    }
};

module.exports = {
    ensureCanViewUser,
    ensureCanManageAssignments,
    ensureOrganizationWriteAccess,
    ensureExpirationIsFuture,
    ensureRoleIsAssignable,
    ensureUserRoleExists,
    ensureTargetSuperAdminIsProtected,
    ensureMembershipExists
};
