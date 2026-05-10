const { body } = require('express-validator');

const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/domain/workflows/controller/workflows.controller');

const buildMocks = () => ({
    workflowsService: {
        getAll: jest.fn(),
        getById: jest.fn(),
        getWithSteps: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getWorkflowSteps: jest.fn(),
        addStepToWorkflow: jest.fn(),
        removeStepFromWorkflow: jest.fn(),
        updateStepOrder: jest.fn(),
        getAllSteps: jest.fn(),
        createStep: jest.fn(),
        updateStep: jest.fn(),
        deleteStep: jest.fn(),
        getJobRoleWorkflows: jest.fn(),
        assignWorkflowToJobRole: jest.fn(),
        removeWorkflowFromJobRole: jest.fn(),
        getUserOnboardingProgress: jest.fn(),
        startUserOnboarding: jest.fn(),
        getTemplates: jest.fn(),
        createFromTemplate: jest.fn()
    }
});

describe('workflows.controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createMockRes();
        next = jest.fn();
    });

    it('returns legacy validation errors for create', async () => {
        const req = createMockReq({
            body: {}
        });

        await body('name').notEmpty().withMessage('Workflow name is required').run(req);
        await controller.create(req, res, next);

        expect(mocks.workflowsService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: [
                expect.objectContaining({
                    msg: 'Workflow name is required',
                    path: 'name'
                })
            ]
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('creates workflows with actor context and default organization fallback', async () => {
        const req = createMockReq({
            body: {
                name: 'Default workflow'
            },
            user: {
                id: 'user-1',
                organization_id: 'org-1'
            }
        });
        const workflow = { id: 'wf-1', name: 'Default workflow' };

        mocks.workflowsService.create.mockResolvedValue(workflow);

        await controller.create(req, res, next);

        expect(mocks.workflowsService.create).toHaveBeenCalledWith({
            name: 'Default workflow',
            organization_id: 'org-1',
            created_by: 'user-1'
        }, {
            actorUserId: 'user-1'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(workflow);
    });

    it('returns 404 when updating a missing workflow', async () => {
        const req = createMockReq({
            params: { id: 'wf-404' },
            body: {
                name: 'Updated workflow'
            },
            user: {
                id: 'user-1'
            }
        });

        mocks.workflowsService.update.mockResolvedValue(null);

        await controller.update(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Workflow not found' });
        expect(next).not.toHaveBeenCalled();
    });

    it('deletes workflows with the same response contract', async () => {
        const req = createMockReq({
            params: { id: 'wf-1' },
            user: {
                id: 'user-1'
            }
        });

        mocks.workflowsService.delete.mockResolvedValue({ id: 'wf-1' });

        await controller.delete(req, res, next);

        expect(mocks.workflowsService.delete).toHaveBeenCalledWith('wf-1', {
            actorUserId: 'user-1',
            minAccess: 'write'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Workflow deleted successfully' });
    });

    it('adds steps to workflows with a created response', async () => {
        const req = createMockReq({
            params: { workflowId: 'wf-1' },
            body: {
                stepId: 'step-1',
                orderIndex: 2
            },
            user: {
                id: 'user-1'
            }
        });
        const assignment = { workflow_id: 'wf-1', step_id: 'step-1', order_index: 2 };

        mocks.workflowsService.addStepToWorkflow.mockResolvedValue(assignment);

        await controller.addStepToWorkflow(req, res, next);

        expect(mocks.workflowsService.addStepToWorkflow).toHaveBeenCalledWith('wf-1', 'step-1', 2, {
            actorUserId: 'user-1',
            minAccess: 'write'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(assignment);
    });

    it('removes steps from workflows with the existing success message', async () => {
        const req = createMockReq({
            params: {
                workflowId: 'wf-1',
                stepId: 'step-1'
            },
            user: {
                id: 'user-1'
            }
        });

        mocks.workflowsService.removeStepFromWorkflow.mockResolvedValue({ removed: true });

        await controller.removeStepFromWorkflow(req, res, next);

        expect(mocks.workflowsService.removeStepFromWorkflow).toHaveBeenCalledWith('wf-1', 'step-1', {
            actorUserId: 'user-1',
            minAccess: 'write'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Step removed from workflow successfully' });
    });

    it('assigns workflows to job roles with the existing created response', async () => {
        const req = createMockReq({
            params: { jobRoleId: 'role-1' },
            body: {
                workflowId: 'wf-1'
            },
            user: {
                id: 'user-1'
            }
        });
        const assignment = { job_role_id: 'role-1', workflow_id: 'wf-1' };

        mocks.workflowsService.assignWorkflowToJobRole.mockResolvedValue(assignment);

        await controller.assignWorkflowToJobRole(req, res, next);

        expect(mocks.workflowsService.assignWorkflowToJobRole).toHaveBeenCalledWith('role-1', 'wf-1', {
            actorUserId: 'user-1',
            minAccess: 'write'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(assignment);
    });

    it('removes workflow assignments from job roles with the existing success message', async () => {
        const req = createMockReq({
            params: {
                jobRoleId: 'role-1',
                workflowId: 'wf-1'
            },
            user: {
                id: 'user-1'
            }
        });

        mocks.workflowsService.removeWorkflowFromJobRole.mockResolvedValue({ removed: true });

        await controller.removeWorkflowFromJobRole(req, res, next);

        expect(mocks.workflowsService.removeWorkflowFromJobRole).toHaveBeenCalledWith('role-1', 'wf-1', {
            actorUserId: 'user-1',
            minAccess: 'write'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Workflow removed from job role successfully' });
    });
});
