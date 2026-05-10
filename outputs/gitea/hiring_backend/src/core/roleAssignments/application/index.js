const { ROLE_LABELS } = require('@shared/auth/roles');
const {
    ensureCanViewUser,
    ensureCanManageAssignments,
    ensureOrganizationWriteAccess,
    ensureExpirationIsFuture,
    ensureRoleIsAssignable,
    ensureUserRoleExists,
    ensureTargetSuperAdminIsProtected,
    ensureMembershipExists
} = require('@core/roleAssignments/domain/roleAssignmentPolicy');

module.exports = ({
    roleAssignmentsStorePort,
    roleAssignmentsRebacOutboxPort,
    roleAssignmentsUnitOfWorkPort,
    logger
}) => {
    const ensureTargetUserCanBeChanged = async (userId, requestingUser) => {
        const targetRole = await roleAssignmentsStorePort.getUserRole(userId);
        ensureTargetSuperAdminIsProtected(targetRole, requestingUser);
        return targetRole;
    };

    const getUserRole = async (userId, requestingUser) => {
        ensureCanViewUser(requestingUser, userId, 'Nedostatečná oprávnění k zobrazení role');

        const role = await roleAssignmentsStorePort.getUserRole(userId);
        ensureUserRoleExists(role);

        return role;
    };

    const updateUserRole = async ({ userId, role }, requestingUser) => {
        ensureCanManageAssignments(requestingUser);
        ensureRoleIsAssignable(role, requestingUser);
        await ensureTargetUserCanBeChanged(userId, requestingUser);

        const updatedRole = await roleAssignmentsUnitOfWorkPort.runInTransaction(async (client) => {
            const user = await roleAssignmentsStorePort.updateUserRole(userId, role, { client });
            await roleAssignmentsRebacOutboxPort.enqueueUserRoleSync(user, { client });
            return user;
        }, { label: 'roleAssignments.updateUserRole' });

        logger.info('User role updated', {
            userId,
            role,
            changedBy: requestingUser.id
        });

        return updatedRole;
    };

    const getUserOrganizationMemberships = async (userId, requestingUser) => {
        ensureCanViewUser(
            requestingUser,
            userId,
            'Nedostatečná oprávnění k zobrazení přístupů do organizací'
        );

        return roleAssignmentsStorePort.getUserOrganizationMemberships(userId);
    };

    const createOrganizationMembership = async (data, requestingUser) => {
        const { userId, organizationId, expiresAt, notes } = data;

        ensureCanManageAssignments(requestingUser);
        ensureOrganizationWriteAccess(requestingUser, organizationId);
        ensureExpirationIsFuture(expiresAt);
        await ensureTargetUserCanBeChanged(userId, requestingUser);

        const membership = await roleAssignmentsUnitOfWorkPort.runInTransaction(async (client) => {
            const createdMembership = await roleAssignmentsStorePort.createOrganizationMembership({
                userId,
                organizationId,
                expiresAt: expiresAt || null,
                assignedBy: requestingUser.id,
                notes
            }, { client });

            await roleAssignmentsRebacOutboxPort.enqueueMembershipSync(createdMembership, { client });
            return createdMembership;
        }, { label: 'roleAssignments.createOrganizationMembership' });

        logger.info('Organization membership created', {
            userId,
            organizationId,
            expiresAt: expiresAt || null,
            assignedBy: requestingUser.id
        });

        return membership;
    };

    const updateOrganizationMembershipExpiration = async (membershipId, expiresAt, requestingUser) => {
        ensureCanManageAssignments(requestingUser);

        const membership = await roleAssignmentsStorePort.getOrganizationMembershipById(membershipId);
        ensureMembershipExists(membership);
        await ensureTargetUserCanBeChanged(membership.user_id, requestingUser);
        ensureOrganizationWriteAccess(requestingUser, membership.organization_id);
        ensureExpirationIsFuture(expiresAt);

        return roleAssignmentsUnitOfWorkPort.runInTransaction(async (client) => {
            const updatedMembership = await roleAssignmentsStorePort.updateOrganizationMembershipExpiration(
                membershipId,
                expiresAt,
                requestingUser.id,
                { client }
            );
            await roleAssignmentsRebacOutboxPort.enqueueMembershipSync(updatedMembership, { client });
            return updatedMembership;
        }, { label: 'roleAssignments.updateOrganizationMembershipExpiration' });
    };

    const deleteOrganizationMembership = async (membershipId, requestingUser) => {
        ensureCanManageAssignments(requestingUser);

        const membership = await roleAssignmentsStorePort.getOrganizationMembershipById(membershipId);
        ensureMembershipExists(membership);
        await ensureTargetUserCanBeChanged(membership.user_id, requestingUser);
        ensureOrganizationWriteAccess(requestingUser, membership.organization_id);

        return roleAssignmentsUnitOfWorkPort.runInTransaction(async (client) => {
            const deletedMembership = await roleAssignmentsStorePort.deleteOrganizationMembership(membershipId, { client });
            await roleAssignmentsRebacOutboxPort.enqueueMembershipDelete(deletedMembership, { client });
            return deletedMembership;
        }, { label: 'roleAssignments.deleteOrganizationMembership' });
    };

    return {
        getUserRole,
        updateUserRole,
        getUserOrganizationMemberships,
        createOrganizationMembership,
        updateOrganizationMembershipExpiration,
        deleteOrganizationMembership,
        ROLE_LABELS
    };
};
