module.exports = ({ workflowsController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    router.use(authMiddleware);
    router.use(requireAuth(ADMIN_ONLY_ROLES));
    // Onboarding Workflows CRUD
    router.get('/', workflowsController.getAll);
    router.get('/:id', workflowsController.getById);
    router.get('/:id/full', workflowsController.getWithSteps); // Get workflow with all steps
    router.post('/', workflowsController.create);
    router.put('/:id', workflowsController.update);
    router.delete('/:id', workflowsController.delete);

    // Workflow Steps Management
    router.get('/:workflowId/steps', workflowsController.getWorkflowSteps);
    router.post('/:workflowId/steps', workflowsController.addStepToWorkflow);
    router.delete('/:workflowId/steps/:stepId', workflowsController.removeStepFromWorkflow);
    router.put('/:workflowId/steps/:stepId/order', workflowsController.updateStepOrder);

    // Onboarding Steps Management
    router.get('/organization/:organizationId/steps', workflowsController.getAllSteps);
    router.post('/steps', workflowsController.createStep);
    router.put('/steps/:id', workflowsController.updateStep);
    router.delete('/steps/:id', workflowsController.deleteStep);

    // Template Workflows
    router.get('/organization/:organizationId/templates', workflowsController.getTemplates);
    router.post('/templates/:templateId/copy', workflowsController.createFromTemplate);

    // Job Role Workflow Assignment
    router.get('/job-role/:jobRoleId/workflows', workflowsController.getJobRoleWorkflows);
    router.post('/job-role/:jobRoleId/assign', workflowsController.assignWorkflowToJobRole);
    router.delete('/job-role/:jobRoleId/workflows/:workflowId', workflowsController.removeWorkflowFromJobRole);

    // User Onboarding Progress
    router.get('/user/:userId/progress', workflowsController.getUserOnboardingProgress);
    router.post('/user/start-onboarding', workflowsController.startUserOnboarding);

    return router;
};
