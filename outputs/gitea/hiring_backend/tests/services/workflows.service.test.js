const createWorkflowsService = require('../../src/domain/workflows/service');

const createDependencies = () => ({
    workflowsRepository: {
        createWorkflow: jest.fn().mockResolvedValue({ id: 'wf-1' }),
        getWorkflowWithSteps: jest.fn().mockResolvedValue({
            id: 'tpl-1',
            name: 'Template',
            description: 'Template description',
            organization_id: 'org-template',
            is_template: true,
            steps: []
        }),
        addStepToWorkflow: jest.fn().mockResolvedValue({})
    },
    onboardingStepsAdminPort: {
        createStep: jest.fn().mockResolvedValue({ id: 'step-1' })
    },
    membershipAccessPort: {
        ensureMembershipCreateAccess: jest.fn().mockResolvedValue({ granted: true })
    }
});

describe('workflows.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('create checks membership create access for workflow organization', async () => {
        const deps = createDependencies();
        const service = createWorkflowsService(deps);

        await service.create({
            name: 'Workflow',
            organization_id: 'org-1'
        }, {
            actorUserId: 'actor-1'
        });

        expect(deps.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['hr', 'admin']
        });
    });

    it('createStep checks membership create access for step organization', async () => {
        const deps = createDependencies();
        const service = createWorkflowsService(deps);

        await service.createStep({
            title: 'Step',
            organization_id: 'org-1'
        }, {
            actorUserId: 'actor-1'
        });

        expect(deps.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['hr', 'admin']
        });
        expect(deps.onboardingStepsAdminPort.createStep).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Step',
                organization_id: 'org-1'
            }),
            expect.objectContaining({
                actorUserId: 'actor-1'
            })
        );
    });

    it('createFromTemplate checks membership create access for target organization', async () => {
        const deps = createDependencies();
        const service = createWorkflowsService(deps);

        await service.createFromTemplate('tpl-1', {
            organization_id: 'org-target',
            name: 'Workflow copy'
        }, {
            actorUserId: 'actor-1'
        });

        expect(deps.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-target',
            allowedRoles: ['hr', 'admin']
        });
    });
});
