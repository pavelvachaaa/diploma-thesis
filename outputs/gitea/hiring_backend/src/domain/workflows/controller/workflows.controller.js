const { handle, sendResult } = require('@shared/http/controller');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({ workflowsService }) => {
    const withActor = (req, options = {}) => ({
        ...options,
        actorUserId: req.user?.id || null
    });

    const validateRequest = (req, res) => ensureRequestValid(req, res, {
        legacyErrorsArray: true
    });

    const notFound = (message) => ({
        statusCode: 404,
        body: { message }
    });

    // Onboarding Workflows
    const getAll = handle(async (req, res) => {
            const options = {
                page: parseInt(req.query.page) || 0,
                limit: parseInt(req.query.limit) || 50,
                search: req.query.q,
                organizationId: req.query.org,
                isTemplate: req.query.template ? req.query.template === 'true' : undefined,
                actorUserId: req.user?.id || null
            };
            return sendResult(res, await workflowsService.getAll(options));
    });

    const getById = handle(async (req, res) => {
            const workflow = await workflowsService.getById(req.params.id, withActor(req));
            if (!workflow) return sendResult(res, notFound('Workflow not found'));
            return sendResult(res, workflow);
    });

    const getWithSteps = handle(async (req, res) => {
            const workflow = await workflowsService.getWithSteps(req.params.id, withActor(req));
            if (!workflow) return sendResult(res, notFound('Workflow not found'));
            return sendResult(res, workflow);
    });

    const create = handle(async (req, res) => {
            if (!validateRequest(req, res)) return;
            const workflowData = {
                ...req.body,
                organization_id: req.body.organization_id || req.user?.organization_id || null,
                created_by: req.user?.id
            };

            return sendResult(res, await workflowsService.create(workflowData, withActor(req)), 201);
    });

    const update = handle(async (req, res) => {
            if (!validateRequest(req, res)) return;
            const workflow = await workflowsService.update(req.params.id, req.body, withActor(req, {
                minAccess: 'write'
            }));
            if (!workflow) return sendResult(res, notFound('Workflow not found'));
            return sendResult(res, workflow);
    });

    const deleteOne = handle(async (req, res) => {
            const workflow = await workflowsService.delete(req.params.id, withActor(req, {
                minAccess: 'write'
            }));
            if (!workflow) return sendResult(res, notFound('Workflow not found'));
            return sendResult(res, { message: 'Workflow deleted successfully' });
    });

    // Workflow Steps Management
    const getWorkflowSteps = handle(async (req, res) => {
            const steps = await workflowsService.getWorkflowSteps(req.params.workflowId, withActor(req));
            return sendResult(res, steps);
    });

    const addStepToWorkflow = handle(async (req, res) => {
            const { workflowId } = req.params;
            const { stepId, orderIndex } = req.body;

            const result = await workflowsService.addStepToWorkflow(workflowId, stepId, orderIndex, withActor(req, {
                minAccess: 'write'
            }));
            if (!result) {
                return sendResult(res, notFound('Workflow or step not found'));
            }
            return sendResult(res, result, 201);
    });

    const removeStepFromWorkflow = handle(async (req, res) => {
            const { workflowId, stepId } = req.params;

            const result = await workflowsService.removeStepFromWorkflow(workflowId, stepId, withActor(req, {
                minAccess: 'write'
            }));
            if (!result) return sendResult(res, notFound('Workflow step assignment not found'));
            return sendResult(res, { message: 'Step removed from workflow successfully' });
    });

    const updateStepOrder = handle(async (req, res) => {
            const { workflowId, stepId } = req.params;
            const { orderIndex } = req.body;

            const result = await workflowsService.updateStepOrder(workflowId, stepId, orderIndex, withActor(req, {
                minAccess: 'write'
            }));
            if (!result) return sendResult(res, notFound('Workflow step assignment not found'));
            return sendResult(res, result);
    });

    // Onboarding Steps Management
    const getAllSteps = handle(async (req, res) => {
            const { organizationId } = req.params;
            const steps = await workflowsService.getAllSteps(organizationId, withActor(req));
            return sendResult(res, steps);
    });

    const createStep = handle(async (req, res) => {
            if (!validateRequest(req, res)) return;
            const step = await workflowsService.createStep({
                ...req.body,
                organization_id: req.body.organization_id || req.user?.organization_id || null
            }, withActor(req));
            return sendResult(res, step, 201);
    });

    const updateStep = handle(async (req, res) => {
            if (!validateRequest(req, res)) return;
            const step = await workflowsService.updateStep(req.params.id, req.body, withActor(req, {
                minAccess: 'write'
            }));
            if (!step) return sendResult(res, notFound('Step not found'));
            return sendResult(res, step);
    });

    const deleteStep = handle(async (req, res) => {
            const step = await workflowsService.deleteStep(req.params.id, withActor(req, {
                minAccess: 'write'
            }));
            if (!step) return sendResult(res, notFound('Step not found'));
            return sendResult(res, { message: 'Step deleted successfully' });
    });

    // Job Role Workflow Assignment
    const getJobRoleWorkflows = handle(async (req, res) => {
            const workflows = await workflowsService.getJobRoleWorkflows(req.params.jobRoleId, withActor(req));
            return sendResult(res, workflows);
    });

    const assignWorkflowToJobRole = handle(async (req, res) => {
            const { jobRoleId } = req.params;
            const { workflowId } = req.body;

            const assignment = await workflowsService.assignWorkflowToJobRole(jobRoleId, workflowId, withActor(req, {
                minAccess: 'write'
            }));
            if (!assignment) {
                return sendResult(res, notFound('Workflow or job role not found'));
            }
            return sendResult(res, assignment, 201);
    });

    const removeWorkflowFromJobRole = handle(async (req, res) => {
            const { jobRoleId, workflowId } = req.params;

            const assignment = await workflowsService.removeWorkflowFromJobRole(jobRoleId, workflowId, withActor(req, {
                minAccess: 'write'
            }));
            if (!assignment) return sendResult(res, notFound('Workflow assignment not found'));
            return sendResult(res, { message: 'Workflow removed from job role successfully' });
    });

    // User Onboarding Progress
    const getUserOnboardingProgress = handle(async (req, res) => {
            const progress = await workflowsService.getUserOnboardingProgress(req.params.userId, withActor(req));
            return sendResult(res, progress);
    });

    const startUserOnboarding = handle(async (req, res) => {
            if (!validateRequest(req, res)) return;
            const progressData = {
                ...req.body,
                assigned_hr: req.user?.id
            };

            const progress = await workflowsService.startUserOnboarding(progressData, withActor(req, {
                minAccess: 'write'
            }));
            return sendResult(res, progress, 201);
    });

    // Template Workflows
    const getTemplates = handle(async (req, res) => {
            const { organizationId } = req.params;
            const templates = await workflowsService.getTemplates(organizationId, withActor(req));
            return sendResult(res, templates);
    });

    const createFromTemplate = handle(async (req, res) => {
            if (!validateRequest(req, res)) return;
            const workflowData = {
                ...req.body,
                organization_id: req.body.organization_id || req.user?.organization_id || null,
                created_by: req.user?.id
            };

            const workflow = await workflowsService.createFromTemplate(req.params.templateId, workflowData, withActor(req));
            return sendResult(res, workflow, 201);
    });

    return {
        getAll,
        getById,
        getWithSteps,
        create,
        update,
        delete: deleteOne,
        getWorkflowSteps,
        addStepToWorkflow,
        removeStepFromWorkflow,
        updateStepOrder,
        getAllSteps,
        createStep,
        updateStep,
        deleteStep,
        getJobRoleWorkflows,
        assignWorkflowToJobRole,
        removeWorkflowFromJobRole,
        getUserOnboardingProgress,
        startUserOnboarding,
        getTemplates,
        createFromTemplate
    };
};
