module.exports = ({ operationsAuditHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.get(
        '/',
        requireAuth(['super_admin']),
        operationsAuditHttpController.getEvents
    );

    return router;
};
