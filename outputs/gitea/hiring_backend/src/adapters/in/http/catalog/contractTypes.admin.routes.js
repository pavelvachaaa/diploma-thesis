module.exports = ({ contractTypesHttpController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.use(authMiddleware);
    router.use(requireAuth(SUPER_ADMIN_ONLY_ROLES));
    router.get('/', contractTypesHttpController.getAll);
    router.get('/:code', contractTypesHttpController.getByCode);
    router.post('/', contractTypesHttpController.create);
    router.put('/:code', contractTypesHttpController.update);
    router.delete('/:code', contractTypesHttpController.delete);

    return router;
};
