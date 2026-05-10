module.exports = ({ documentTypesHttpController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.use(authMiddleware);
    router.use(requireAuth(SUPER_ADMIN_ONLY_ROLES));
    router.get('/', documentTypesHttpController.getAll);
    router.get('/:id', documentTypesHttpController.getById);
    router.post('/', documentTypesHttpController.create);
    router.put('/:id', documentTypesHttpController.update);
    router.delete('/:id', documentTypesHttpController.delete);

    return router;
};
