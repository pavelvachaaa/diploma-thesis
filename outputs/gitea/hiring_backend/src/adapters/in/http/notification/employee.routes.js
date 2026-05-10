module.exports = ({ notificationHttpController }) => {
    const { Router } = require('express');
    const { forbidAuthorizedPersonOnly, requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.use(requireAuth([]));
    router.use(forbidAuthorizedPersonOnly);

    router.get('/', notificationHttpController.getNotifications);
    router.get('/unread_count', notificationHttpController.getUnreadCount);
    router.post('/:id/read', notificationHttpController.markAsRead);
    router.post('/read_all', notificationHttpController.markAllAsRead);
    router.get('/preferences', notificationHttpController.getPreferences);
    router.put('/preferences', notificationHttpController.updatePreferences);
    router.get('/preferences/types/:code', notificationHttpController.getTypePreferences);
    router.put('/preferences/types/:code', notificationHttpController.updateTypePreferences);

    return router;
};
