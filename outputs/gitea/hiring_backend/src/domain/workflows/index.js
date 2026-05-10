module.exports = {
    name: 'workflows',
    basePath: __dirname,
    registrations: {
        workflowsRepository: './repository',
        workflowsService: './service',
        workflowsController: './controller/workflows.controller'
    }
};
