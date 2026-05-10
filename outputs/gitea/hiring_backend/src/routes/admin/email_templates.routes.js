module.exports = ({ emailTemplatesController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.use(requireAuth(SUPER_ADMIN_ONLY_ROLES));

    router.get('/', emailTemplatesController.getAll);
    router.get('/:id', emailTemplatesController.getById);
    router.post('/', emailTemplatesController.create);
    router.put('/:id', emailTemplatesController.update);
    router.delete('/:id', emailTemplatesController.remove);

    return router;
};
