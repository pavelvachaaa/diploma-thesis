module.exports = ({ workflowsRepository, onboardingStepsAdminPort, membershipAccessPort }) => {
    const getAll = async (options) => workflowsRepository.getAllWorkflows(options);

    const getById = async (id, options = {}) => workflowsRepository.getWorkflowById(id, options);

    const getWithSteps = async (id, options = {}) => workflowsRepository.getWorkflowWithSteps(id, options);

    const create = async (data, options = {}) => {
        if (!data.name || !data.organization_id) {
            throw new Error('Name and organization_id are required');
        }

        await membershipAccessPort.ensureMembershipCreateAccess({
            actorUserId: options.actorUserId || null,
            organizationId: data.organization_id,
            allowedRoles: ['hr', 'admin']
        });

        return workflowsRepository.createWorkflow(data, options);
    };

    const update = async (id, data, options = {}) => {
        const workflow = await workflowsRepository.getWorkflowById(id, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'write'
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return workflowsRepository.updateWorkflow(id, data, options);
    };

    const deleteWorkflow = async (id, options = {}) => {
        const workflow = await workflowsRepository.getWorkflowById(id, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'write'
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return workflowsRepository.deleteWorkflow(id, options);
    };

    const getWorkflowSteps = async (workflowId, options = {}) => workflowsRepository.getWorkflowSteps(workflowId, options);

    const addStepToWorkflow = async (workflowId, stepId, orderIndex, options = {}) => {
        const workflow = await workflowsRepository.getWorkflowById(workflowId, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'write'
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return workflowsRepository.addStepToWorkflow(workflowId, stepId, orderIndex, options);
    };

    const removeStepFromWorkflow = async (workflowId, stepId, options = {}) =>
        workflowsRepository.removeStepFromWorkflow(workflowId, stepId, options);

    const updateStepOrder = async (workflowId, stepId, orderIndex, options = {}) =>
        workflowsRepository.updateStepOrder(workflowId, stepId, orderIndex, options);

    const getAllSteps = async (organizationId, options = {}) =>
        onboardingStepsAdminPort.getAllSteps(organizationId, options);

    const createStep = async (data, options = {}) => {
        await membershipAccessPort.ensureMembershipCreateAccess({
            actorUserId: options.actorUserId || null,
            organizationId: data.organization_id,
            allowedRoles: ['hr', 'admin']
        });
        return onboardingStepsAdminPort.createStep(data, options);
    };

    const updateStep = async (id, data, options = {}) => onboardingStepsAdminPort.updateStep(id, data, options);

    const deleteStep = async (id, options = {}) => onboardingStepsAdminPort.deleteStep(id, options);

    const getJobRoleWorkflows = async (jobRoleId, options = {}) =>
        workflowsRepository.getJobRoleWorkflows(jobRoleId, options);

    const assignWorkflowToJobRole = async (jobRoleId, workflowId, options = {}) => {
        const workflow = await workflowsRepository.getWorkflowById(workflowId, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'write'
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return workflowsRepository.assignWorkflowToJobRole(jobRoleId, workflowId, options);
    };

    const removeWorkflowFromJobRole = async (jobRoleId, workflowId, options = {}) =>
        workflowsRepository.removeWorkflowFromJobRole(jobRoleId, workflowId, options);

    const getUserOnboardingProgress = async (userId, options = {}) =>
        workflowsRepository.getUserOnboardingProgress(userId, options);

    const startUserOnboarding = async (data, options = {}) => {
        if (!data.user_id || !data.workflow_id || !data.start_date) {
            throw new Error('user_id, workflow_id, and start_date are required');
        }

        const workflow = await workflowsRepository.getWorkflowById(data.workflow_id, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'write'
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return workflowsRepository.startUserOnboarding(data, options);
    };

    const getTemplates = async (organizationId, options = {}) => workflowsRepository.getAllWorkflows({
        ...options,
        organizationId,
        isTemplate: true,
        limit: 100
    });

    const createFromTemplate = async (templateId, data, options = {}) => {
        const template = await workflowsRepository.getWorkflowWithSteps(templateId, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'read'
        });
        if (!template || !template.is_template) {
            throw new Error('Template not found');
        }

        await membershipAccessPort.ensureMembershipCreateAccess({
            actorUserId: options.actorUserId || null,
            organizationId: data.organization_id || template.organization_id,
            allowedRoles: ['hr', 'admin']
        });

        const newWorkflow = await workflowsRepository.createWorkflow({
            name: data.name || `${template.name} - Kopie`,
            description: data.description || template.description,
            organization_id: data.organization_id || template.organization_id,
            is_template: false,
            created_by: data.created_by
        }, options);

        if (template.steps && template.steps.length > 0) {
            for (const step of template.steps) {
                await workflowsRepository.addStepToWorkflow(
                    newWorkflow.id,
                    step.id,
                    step.workflow_order,
                    options
                );
            }
        }

        return newWorkflow;
    };

    return {
        getAll,
        getById,
        getWithSteps,
        create,
        update,
        delete: deleteWorkflow,
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
