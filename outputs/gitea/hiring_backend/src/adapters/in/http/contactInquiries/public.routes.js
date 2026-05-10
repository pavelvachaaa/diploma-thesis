module.exports = ({ contactInquiriesHttpController }) => {
    const { Router } = require('express');

    const router = Router();

    router.post('/', contactInquiriesHttpController.submitPublicInquiry);

    return router;
};
