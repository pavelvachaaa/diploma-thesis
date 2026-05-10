const SUPER_ADMIN_ROLE = 'super_admin';

const isSuperAdmin = (actor = {}) => (
    Array.isArray(actor.roles) && actor.roles.includes(SUPER_ADMIN_ROLE)
);

const create = (actor = {}) => {
    if (isSuperAdmin(actor)) {
        return Object.freeze({
            organizationIds: null,
            scopeUserId: null
        });
    }

    return Object.freeze({
        organizationIds: Array.isArray(actor.organizations) ? [...actor.organizations] : [],
        scopeUserId: actor.id || null
    });
};

module.exports = Object.freeze({
    create
});
