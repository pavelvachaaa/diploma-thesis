const {
    ADMIN_SHELL_ROLES,
    ADMIN_HR_AUTHORIZED_PERSON_ROLES,
    ADMIN_HR_ROLES
} = require('./roles');

const ADMIN_CAPABILITIES = Object.freeze({
    ORGANIZATIONS_LOOKUP: 'organizations.lookup',
    JOB_ROLE_CLASSIFICATIONS_LOOKUP: 'job_roles.classifications.lookup',
    JOB_ROLE_SECTION_ITEMS_LOOKUP: 'job_roles.section_items.lookup',
    SECTION_ITEMS_LOOKUP: 'section_items.lookup'
});

const CAPABILITY_ROLE_MAP = Object.freeze({
    [ADMIN_CAPABILITIES.ORGANIZATIONS_LOOKUP]: ADMIN_SHELL_ROLES,
    [ADMIN_CAPABILITIES.JOB_ROLE_CLASSIFICATIONS_LOOKUP]: ADMIN_HR_AUTHORIZED_PERSON_ROLES,
    [ADMIN_CAPABILITIES.JOB_ROLE_SECTION_ITEMS_LOOKUP]: ADMIN_HR_ROLES,
    [ADMIN_CAPABILITIES.SECTION_ITEMS_LOOKUP]: ADMIN_HR_ROLES
});

const getAdminCapabilityRoles = (capability) => {
    const roles = CAPABILITY_ROLE_MAP[capability];
    if (!roles) {
        throw new Error(`Unknown admin capability: ${capability}`);
    }

    return roles;
};

module.exports = {
    ADMIN_CAPABILITIES,
    getAdminCapabilityRoles
};
