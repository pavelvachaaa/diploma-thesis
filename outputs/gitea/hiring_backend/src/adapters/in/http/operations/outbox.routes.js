module.exports = ({ operationsOutboxHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.use(requireAuth(['super_admin']));

    router.get('/summary', operationsOutboxHttpController.getSummary);
    router.get('/events', operationsOutboxHttpController.getEvents);
    router.post('/replay', operationsOutboxHttpController.replayDead);

    return router;
};
