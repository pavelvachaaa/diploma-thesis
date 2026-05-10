module.exports = ({ jobRolesHttpController }) => {
    const { Router } = require('express');

    const router = Router();

    router.get('/', jobRolesHttpController.getAll);
    router.get('/classifications', jobRolesHttpController.getAllClassifications);
    router.get('/unique', jobRolesHttpController.getUniqueNames);
    router.get('/organization/:organizationId', jobRolesHttpController.getByOrganization);
    router.get('/:id', jobRolesHttpController.getById);

    return router;
};
