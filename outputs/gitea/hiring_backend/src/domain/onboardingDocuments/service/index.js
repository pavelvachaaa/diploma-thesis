const createCoreService = require('./core');
const createTemplateLifecycleService = require('./templateLifecycle');
const createAssignmentsService = require('./assignments');
const createUserDocumentsService = require('./userDocuments');

module.exports = (deps) => {
    const core = createCoreService(deps);

    return {
        ...createTemplateLifecycleService(core),
        ...createAssignmentsService(core),
        ...createUserDocumentsService(core)
    };
};
