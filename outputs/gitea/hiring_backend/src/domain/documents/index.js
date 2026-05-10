module.exports = {
    name: 'documents',
    basePath: __dirname,
    registrations: {
        documentsRepository: './repository',
        documentsService: './service',
        documentsController: './controller',
        documentsEvents: './events'
    }
};
