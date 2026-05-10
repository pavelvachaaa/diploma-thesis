module.exports = ({ jobPostingStatusesHttpController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.use(authMiddleware);
    router.use(requireAuth(SUPER_ADMIN_ONLY_ROLES));
    router.get('/', jobPostingStatusesHttpController.getAll);
    router.get('/:code', jobPostingStatusesHttpController.getByCode);
    router.post('/', jobPostingStatusesHttpController.create);
    router.put('/:code', jobPostingStatusesHttpController.update);
    router.delete('/:code', jobPostingStatusesHttpController.delete);

    return router;
};
