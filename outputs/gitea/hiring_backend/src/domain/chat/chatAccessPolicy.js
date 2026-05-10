const {
    AUTHORIZED_PERSON_ROLE,
    ELEVATED_ADMIN_ROLES,
    SUPER_ADMIN_ROLE,
    hasAnyRole
} = require('@shared/auth/roles');

const CHAT_OPERATOR_ROLES = [...ELEVATED_ADMIN_ROLES, AUTHORIZED_PERSON_ROLE];

const hasElevatedRole = (roles = []) => hasAnyRole(roles, CHAT_OPERATOR_ROLES);

const resolveOrganizationIds = (user = {}) => {
    const organizations = Array.isArray(user.organizations) ? user.organizations.filter(Boolean) : [];
    if (organizations.length > 0) {
        return [...new Set(organizations)];
    }

    return user.organization_id ? [user.organization_id] : [];
};

const resolveChatAccessScope = (user = {}) => ({
    organizationIds: resolveOrganizationIds(user)
});

module.exports = ({ chatRepository }) => {
    const isEmployeeOnlyUser = (user = {}) => {
        const roles = Array.isArray(user.roles) ? user.roles : [];
        return roles.includes('user') && !hasElevatedRole(roles);
    };

    const mergeUsers = (...groups) => {
        const usersById = new Map();

        for (const group of groups) {
            for (const user of group || []) {
                if (!user?.id) {
                    continue;
                }

                if (!usersById.has(user.id)) {
                    usersById.set(user.id, user);
                }
            }
        }

        return Array.from(usersById.values()).sort((left, right) => {
            const leftLabel = `${left.name || ''} ${left.surname || ''} ${left.email || ''}`.trim();
            const rightLabel = `${right.name || ''} ${right.surname || ''} ${right.email || ''}`.trim();
            return leftLabel.localeCompare(rightLabel, 'cs');
        });
    };

    const getAllowedPeers = async (currentUser, options = {}) => {
        if (!currentUser?.id) {
            throw new Error('Current user is required');
        }

        const accessScope = resolveChatAccessScope(currentUser);

        if (isEmployeeOnlyUser(currentUser) || options.forceHrOnly) {
            return chatRepository.getUsersByOrganizationScope({
                organizationIds: accessScope.organizationIds || [],
                excludeUserId: currentUser.id,
                allowedRoles: CHAT_OPERATOR_ROLES
            });
        }

        if ((accessScope.organizationIds || []).length > 0) {
            return chatRepository.getUsersByOrganizationScope({
                organizationIds: accessScope.organizationIds || [],
                excludeUserId: currentUser.id
            });
        }

        if (Array.isArray(currentUser?.roles) && currentUser.roles.includes(SUPER_ADMIN_ROLE)) {
            return chatRepository.getUsersByOrganizationScope({
                excludeUserId: currentUser.id,
                includeAllOrganizations: true
            });
        }

        return [];
    };

    const assertPeerAccessible = async (currentUser, peerUserId) => {
        if (isEmployeeOnlyUser(currentUser)) {
            const peers = await getAllowedPeers(currentUser);
            const allowedPeerIds = new Set(peers.map((peer) => peer.id));

            if (!allowedPeerIds.has(peerUserId)) {
                throw new Error('Access denied: this conversation is not available');
            }
        }
    };

    const filterThreads = async (currentUser, threads = []) => {
        if (!isEmployeeOnlyUser(currentUser)) {
            return threads;
        }

        const peers = await getAllowedPeers(currentUser);
        const allowedPeerIds = new Set(peers.map((peer) => peer.id));
        return threads.filter((thread) => allowedPeerIds.has(thread.peerUserId));
    };

    return {
        getAllowedPeers,
        assertPeerAccessible,
        filterThreads
    };
};
