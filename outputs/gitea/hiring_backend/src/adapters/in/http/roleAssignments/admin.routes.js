module.exports = ({ roleAssignmentsHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.get('/:userId/role',
        requireAuth(ADMIN_ONLY_ROLES),
        roleAssignmentsHttpController.getUserRole
    );

    router.put('/:userId/role',
        requireAuth(ADMIN_ONLY_ROLES),
        roleAssignmentsHttpController.updateUserRole
    );

    router.get('/:userId/organization-memberships',
        requireAuth(ADMIN_ONLY_ROLES),
        roleAssignmentsHttpController.getUserOrganizationMemberships
    );

    router.post('/:userId/organization-memberships',
        requireAuth(ADMIN_ONLY_ROLES),
        roleAssignmentsHttpController.createOrganizationMembership
    );

    router.put('/organization-memberships/:membershipId/expiration',
        requireAuth(ADMIN_ONLY_ROLES),
        roleAssignmentsHttpController.updateOrganizationMembershipExpiration
    );

    router.delete('/organization-memberships/:membershipId',
        requireAuth(ADMIN_ONLY_ROLES),
        roleAssignmentsHttpController.deleteOrganizationMembership
    );

    return router;
};
