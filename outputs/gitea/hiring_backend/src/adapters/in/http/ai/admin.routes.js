module.exports = ({ aiJobChatHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_HR_AUTHORIZED_PERSON_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.use(requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES));

    router.post('/stream', aiJobChatHttpController.streamChat);
    router.post('/extract', aiJobChatHttpController.extractJob);
    router.post('/refine', aiJobChatHttpController.refineText);

    return router;
};
