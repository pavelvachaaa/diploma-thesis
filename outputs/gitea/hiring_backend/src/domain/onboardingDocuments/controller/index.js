const createRunWrite = require('@shared/http/runWrite');
const { ensureRequestValid } = require('@shared/http/validation');
const createDocumentsHandlers = require('./documents.handlers');
const createUserDocumentsHandlers = require('./userDocuments.handlers');
const createTemplatesWorkflowStepsHandlers = require('./templatesWorkflowSteps.handlers');

module.exports = ({ onboardingDocumentsService, commandIdempotencyService, logger }) => {
    const runWrite = createRunWrite({
        commandIdempotencyService,
        logger
    });

    return {
        ...createDocumentsHandlers({
            onboardingDocumentsService,
            runWrite,
            ensureRequestValid
        }),
        ...createUserDocumentsHandlers({
            onboardingDocumentsService,
            runWrite
        }),
        ...createTemplatesWorkflowStepsHandlers({
            onboardingDocumentsService,
            runWrite,
            ensureRequestValid
        })
    };
};
