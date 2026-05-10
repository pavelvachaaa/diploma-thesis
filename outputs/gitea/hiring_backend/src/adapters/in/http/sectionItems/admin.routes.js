module.exports = ({ sectionItemsHttpController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_ONLY_ROLES } = require('@shared/auth/roles');
    const { ADMIN_CAPABILITIES, getAdminCapabilityRoles } = require('@shared/auth/adminCapabilities');

    const router = Router();

    router.use(authMiddleware);
    router.get(
        '/section-types',
        requireAuth(getAdminCapabilityRoles(ADMIN_CAPABILITIES.SECTION_ITEMS_LOOKUP)),
        sectionItemsHttpController.getAllSectionTypes
    );
    router.get(
        '/by-section-type/:sectionType',
        requireAuth(getAdminCapabilityRoles(ADMIN_CAPABILITIES.SECTION_ITEMS_LOOKUP)),
        sectionItemsHttpController.getBySectionType
    );
    router.get(
        '/:id',
        requireAuth(getAdminCapabilityRoles(ADMIN_CAPABILITIES.SECTION_ITEMS_LOOKUP)),
        sectionItemsHttpController.getById
    );

    router.use(requireAuth(ADMIN_ONLY_ROLES));

    router.get('/', sectionItemsHttpController.getAll);
    router.post('/', sectionItemsHttpController.create);
    router.put('/:id', sectionItemsHttpController.update);
    router.delete('/:id', sectionItemsHttpController.delete);
    router.post('/reorder', sectionItemsHttpController.updateOrderIndices);

    return router;
};
