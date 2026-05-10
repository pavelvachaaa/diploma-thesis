const createOnboardingStepsEvents = require('@domain/onboardingSteps/events');
const createQueries = require('./queries');
const createLifecycle = require('./lifecycle');
const createForms = require('./forms');
const createDocuments = require('./documents');
const createAdminQueries = require('./adminQueries');
const createStepDefinitions = require('./stepDefinitions');

module.exports = ({ onboardingStepsRepository, sideEffectOutboxService }) => {
    const onboardingStepsEvents = createOnboardingStepsEvents({ sideEffectOutboxService });

    const queries = createQueries({ onboardingStepsRepository });
    const lifecycle = createLifecycle({ onboardingStepsRepository, onboardingStepsEvents });
    const forms = createForms({ onboardingStepsRepository });
    const documents = createDocuments({ onboardingStepsRepository });
    const adminQueries = createAdminQueries({ onboardingStepsRepository });
    const stepDefinitions = createStepDefinitions({ onboardingStepsRepository });

    return {
        ...queries,
        ...lifecycle,
        ...forms,
        ...documents,
        ...adminQueries,
        ...stepDefinitions
    };
};
