const createEmployeeOnboardingService = require('../../src/domain/employeeOnboarding/service');

const createDependencies = () => ({
    employeeOnboardingRepository: {},
    employeeOnboardingStepPort: {},
    onboardingTemplateQueryPort: {}
});

describe('employeeOnboarding.service API contract', () => {
    it('exposes expected employee onboarding service API surface', () => {
        const service = createEmployeeOnboardingService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'completeStep',
            'getDashboardData',
            'getDashboardDataForEmployee',
            'getOnboardingSteps',
            'getOnboardingStepsForEmployee',
            'getProgress',
            'getProgressForEmployee',
            'getRequiredDocuments',
            'getTemplateForDownload',
            'startStep'
        ]);
    });
});
