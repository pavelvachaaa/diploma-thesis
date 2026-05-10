module.exports = ({ internalUsersHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.get('/search', requireAuth(['admin', 'hr']), internalUsersHttpController.search);

    return router;
};
