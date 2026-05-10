module.exports = ({ jobRolesHttpController, sectionItemsHttpController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const {
        ADMIN_ONLY_ROLES
    } = require('@shared/auth/roles');
    const { ADMIN_CAPABILITIES, getAdminCapabilityRoles } = require('@shared/auth/adminCapabilities');

    const router = Router();

    router.use(authMiddleware);
    router.get('/classifications',
        requireAuth(getAdminCapabilityRoles(ADMIN_CAPABILITIES.JOB_ROLE_CLASSIFICATIONS_LOOKUP)),
        jobRolesHttpController.getAllClassifications
    );
    router.get('/:jobRoleId/section-items',
        requireAuth(getAdminCapabilityRoles(ADMIN_CAPABILITIES.JOB_ROLE_SECTION_ITEMS_LOOKUP)),
        sectionItemsHttpController.getByJobRole
    );
    router.use(requireAuth(ADMIN_ONLY_ROLES));

    router.get('/', jobRolesHttpController.getAll);
    router.get('/:id', jobRolesHttpController.getById);
    router.get('/organization/:organizationId', jobRolesHttpController.getByOrganization);
    router.post('/', jobRolesHttpController.create);
    router.put('/:id', jobRolesHttpController.update);
    router.delete('/:id', jobRolesHttpController.delete);

    router.post('/:jobRoleId/section-items', sectionItemsHttpController.addToJobRole);
    router.put('/:jobRoleId/section-items/:sectionType', sectionItemsHttpController.replaceJobRoleSectionItems);
    router.put('/section-items/:id', sectionItemsHttpController.updateJobRoleItem);
    router.delete('/section-items/:id', sectionItemsHttpController.removeFromJobRole);

    return router;
};
