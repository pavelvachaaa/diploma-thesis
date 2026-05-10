const createLocalLogin = require('./localLogin');
const createOAuthUseCases = require('./oauth');
const createSessionUseCases = require('./session');

const REQUIRED_DEPENDENCIES = [
    'authUserStorePort',
    'authPasswordHasherPort',
    'authTokenPort',
    'authIdentityProviderPort',
    'authAuditPort',
    'authMembershipSyncPort',
    'authUnitOfWorkPort',
    'seatLocationOrganizationLookupPort'
];

module.exports = (deps = {}) => {
    for (const name of REQUIRED_DEPENDENCIES) {
        if (!deps[name]) {
            throw new Error(`${name} dependency is required`);
        }
    }

    const sharedDeps = {
        authUserStorePort: deps.authUserStorePort,
        authPasswordHasherPort: deps.authPasswordHasherPort,
        authTokenPort: deps.authTokenPort,
        authIdentityProviderPort: deps.authIdentityProviderPort,
        authAuditPort: deps.authAuditPort,
        authMembershipSyncPort: deps.authMembershipSyncPort,
        authUnitOfWorkPort: deps.authUnitOfWorkPort,
        seatLocationOrganizationLookupPort: deps.seatLocationOrganizationLookupPort,
        logger: deps.logger
    };

    return {
        handleLocalLogin: createLocalLogin(sharedDeps),
        ...createOAuthUseCases(sharedDeps),
        ...createSessionUseCases(sharedDeps)
    };
};
