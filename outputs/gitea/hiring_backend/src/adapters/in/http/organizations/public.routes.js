module.exports = ({ organizationsHttpController }) => {
    const { Router } = require('express');

    const router = Router();

    router.get('/', organizationsHttpController.getAll);
    router.get('/:id/contact-photo', organizationsHttpController.getContactPhoto);
    router.get('/:id', organizationsHttpController.getById);

    return router;
};
