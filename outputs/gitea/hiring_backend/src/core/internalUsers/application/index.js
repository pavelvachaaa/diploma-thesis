const createSearch = require('./search');
const createEnsureLocalUser = require('./ensureLocalUser');
const createOrganizationLookup = require('./organizationLookup');

module.exports = ({ internalUsersStorePort, internalUserDirectoryPort }) => {
    const search = createSearch({
        internalUsersStorePort,
        internalUserDirectoryPort
    });
    const ensureLocalUser = createEnsureLocalUser({
        internalUsersStorePort
    });
    const getOrganizationBySeatLocation = createOrganizationLookup({
        internalUsersStorePort
    });

    return {
        search,
        ensureLocalUser,
        getOrganizationBySeatLocation
    };
};
