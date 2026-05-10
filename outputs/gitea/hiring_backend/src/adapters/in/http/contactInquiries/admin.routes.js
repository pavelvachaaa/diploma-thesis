module.exports = ({ contactInquiriesHttpController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.get('/', requireAuth(['admin', 'hr']), contactInquiriesHttpController.getAllContactInquiriesAdmin);
    router.get('/:id', requireAuth(['admin', 'hr']), contactInquiriesHttpController.getContactInquiryByIdAdmin);
    router.post('/:id/send-email', requireAuth(['admin', 'hr']), contactInquiriesHttpController.sendReplyAdmin);

    return router;
};
