module.exports = ({ mzcrAccreditationsHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { ELEVATED_ADMIN_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.get('/', requireAuth(ELEVATED_ADMIN_ROLES), mzcrAccreditationsHttpController.getAll);
    router.get('/meta', requireAuth(ELEVATED_ADMIN_ROLES), mzcrAccreditationsHttpController.getMeta);

    return router;
};
