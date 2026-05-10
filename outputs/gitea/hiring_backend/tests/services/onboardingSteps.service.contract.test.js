const createOnboardingStepsService = require('../../src/domain/onboardingSteps/service');

const createDependencies = () => ({
    onboardingStepsRepository: {},
    sideEffectOutboxService: {
        enqueueRoleNotification: jest.fn()
    }
});

describe('onboardingSteps.service API contract', () => {
    it('exposes expected onboarding steps service API surface', () => {
        const service = createOnboardingStepsService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'acknowledgeStep',
            'completeStep',
            'createStep',
            'deleteStep',
            'getAllStepForms',
            'getAllSteps',
            'getDocumentForDownload',
            'getStepDetails',
            'getStepDetailsForEmployee',
            'getStepForm',
            'markDocumentRead',
            'previewForm',
            'skipStep',
            'startStep',
            'submitForm',
            'updateStep',
            'updateStepForm'
        ]);
    });
});
