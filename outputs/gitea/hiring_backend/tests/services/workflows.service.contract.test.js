const createWorkflowsService = require('../../src/domain/workflows/service');

const createDependencies = () => ({
    workflowsRepository: {},
    onboardingStepsAdminPort: {},
    membershipAccessPort: {}
});

describe('workflows.service API contract', () => {
    it('exposes expected workflows service API surface', () => {
        const service = createWorkflowsService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'addStepToWorkflow',
            'assignWorkflowToJobRole',
            'create',
            'createFromTemplate',
            'createStep',
            'delete',
            'deleteStep',
            'getAll',
            'getAllSteps',
            'getById',
            'getJobRoleWorkflows',
            'getTemplates',
            'getUserOnboardingProgress',
            'getWithSteps',
            'getWorkflowSteps',
            'removeStepFromWorkflow',
            'removeWorkflowFromJobRole',
            'startUserOnboarding',
            'update',
            'updateStep',
            'updateStepOrder'
        ]);
    });
});
