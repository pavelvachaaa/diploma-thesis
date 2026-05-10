module.exports = ({ contractTypesHttpController }) => {
    const { Router } = require('express');

    const router = Router();

    router.get('/', contractTypesHttpController.getAll);
    router.get('/:code', contractTypesHttpController.getByCode);

    return router;
};
