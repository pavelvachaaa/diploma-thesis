const createTxRunner = require('@platform/transaction/createTxRunner');
const createUserStepsRepository = require('./userSteps');
const createFormsRepository = require('./forms');
const createDocumentsRepository = require('./documents');
const createAdminStepsRepository = require('./adminSteps');

module.exports = ({ db, logger }) => {
    const getExecutor = (options = {}) => options.client || db;
    const { runInTransaction } = createTxRunner({
        db,
        logger,
        defaultLabel: 'onboardingSteps.repository'
    });

    const createEmptyForm = (stepId) => ({
        id: `step-${stepId}`,
        schemaVersion: 1,
        title: '',
        description: '',
        fields: [],
        ui: { layout: 'one_column', groups: [] },
        validation: { uniqueKeys: [], customRules: [] }
    });

    const parseForm = (formValue, stepId) => {
        if (!formValue) {
            return null;
        }

        try {
            return typeof formValue === 'string' ? JSON.parse(formValue) : formValue;
        } catch (error) {
            logger?.warn?.('Failed to parse onboarding form JSON', {
                error: error.message,
                stepId
            });
            return createEmptyForm(stepId);
        }
    };

    const withTransaction = (callback) => runInTransaction((client) => callback(client));

    return {
        withTransaction,
        ...createUserStepsRepository({
            getExecutor,
            parseForm,
            createEmptyForm
        }),
        ...createFormsRepository({
            getExecutor,
            parseForm,
            createEmptyForm
        }),
        ...createDocumentsRepository({
            getExecutor
        }),
        ...createAdminStepsRepository({
            getExecutor
        })
    };
};
