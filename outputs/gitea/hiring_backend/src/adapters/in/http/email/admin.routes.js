module.exports = ({ emailHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();
    router.use(requireAuth(SUPER_ADMIN_ONLY_ROLES));

    router.get('/', emailHttpController.getAll);
    router.get('/:id', emailHttpController.getById);
    router.post('/', emailHttpController.create);
    router.put('/:id', emailHttpController.update);
    router.delete('/:id', emailHttpController.remove);

    return router;
};
