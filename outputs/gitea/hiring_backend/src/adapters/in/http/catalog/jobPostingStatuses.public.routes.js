module.exports = ({ jobPostingStatusesHttpController }) => {
    const { Router } = require('express');

    const router = Router();

    router.get('/', jobPostingStatusesHttpController.getAll);
    router.get('/:code', jobPostingStatusesHttpController.getByCode);

    return router;
};
