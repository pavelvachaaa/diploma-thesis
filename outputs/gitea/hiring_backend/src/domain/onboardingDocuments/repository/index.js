const createCoreRepository = require('./core');
const createTemplateLifecycleRepository = require('./templateLifecycle');
const createAssignmentsRepository = require('./assignments');
const createUserDocumentsRepository = require('./userDocuments');
const createDownloadsRepository = require('./downloads');

module.exports = (deps) => {
    const core = createCoreRepository(deps);

    return {
        ...createTemplateLifecycleRepository(core),
        ...createAssignmentsRepository(core),
        ...createUserDocumentsRepository(core),
        ...createDownloadsRepository(core)
    };
};
