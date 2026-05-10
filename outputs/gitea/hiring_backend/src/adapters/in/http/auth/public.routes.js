module.exports = ({ authController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.post('/login', authController.login);
    router.post('/logout', authController.logout);
    router.post('/oauth2/cisco', authController.oauth2Cisco);
    router.post('/oauth/token-exchange', authController.exchangeOAuthToken);
    router.post('/oauth/ucp-login', authController.ucpLogin);
    router.get('/me', authController.me);
    router.put('/change-password', requireAuth(), authController.changePassword);

    return router;
};
