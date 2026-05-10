const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ roleAssignmentsApplication }) => {
    const getUserRole = handle(async (req, res) => {
        const { userId } = req.params;
        const role = await roleAssignmentsApplication.getUserRole(userId, req.user);
        return sendResult(res, role);
    });

    const updateUserRole = handle(async (req, res) => {
        const { userId } = req.params;
        const { role } = req.body;
        const updatedRole = await roleAssignmentsApplication.updateUserRole({
            userId,
            role
        }, req.user);

        return sendResult(res, {
            message: 'User role updated successfully',
            role: updatedRole
        });
    });

    const getUserOrganizationMemberships = handle(async (req, res) => {
        const { userId } = req.params;
        const memberships = await roleAssignmentsApplication.getUserOrganizationMemberships(userId, req.user);
        return sendResult(res, memberships);
    });

    const createOrganizationMembership = handle(async (req, res) => {
        const { userId } = req.params;
        const membership = await roleAssignmentsApplication.createOrganizationMembership({
            userId,
            ...req.body
        }, req.user);

        return sendResult(res, {
            message: 'Organization membership created successfully',
            membership
        }, 201);
    });

    const updateOrganizationMembershipExpiration = handle(async (req, res) => {
        const { membershipId } = req.params;
        const { expiresAt } = req.body;
        const membership = await roleAssignmentsApplication.updateOrganizationMembershipExpiration(
            membershipId,
            expiresAt,
            req.user
        );

        return sendResult(res, {
            message: 'Organization membership expiration updated successfully',
            membership
        });
    });

    const deleteOrganizationMembership = handle(async (req, res) => {
        const { membershipId } = req.params;
        await roleAssignmentsApplication.deleteOrganizationMembership(membershipId, req.user);
        return sendResult(res, { message: 'Organization membership deleted successfully' });
    });

    return {
        getUserRole,
        updateUserRole,
        getUserOrganizationMemberships,
        createOrganizationMembership,
        updateOrganizationMembershipExpiration,
        deleteOrganizationMembership
    };
};
