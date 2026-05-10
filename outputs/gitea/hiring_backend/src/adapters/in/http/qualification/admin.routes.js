module.exports = ({ qualificationHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_HR_AUTHORIZED_PERSON_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.post('/lookup', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), qualificationHttpController.lookup);

    return router;
};
