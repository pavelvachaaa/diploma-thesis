module.exports = ({ onboardingDocumentsController, onboardingDocumentsService, fileHandler, fileDownload }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_ONLY_ROLES } = require('@shared/auth/roles');
    const { createUploadMiddleware } = fileHandler;
    const { downloadFile, streamFile } = fileDownload;

    const router = Router();
    const uploadOnboardingTemplate = createUploadMiddleware('onboarding-templates');

    router.use(authMiddleware);
    router.use(requireAuth(ADMIN_ONLY_ROLES));

    // Admin onboarding documents management routes
    router.get('/', onboardingDocumentsController.getAll);
    router.get('/:id', onboardingDocumentsController.getById);
    router.get('/:id/download', async (req, res, next) => {
        try {
            const fileInfo = await onboardingDocumentsService.getOnboardingTemplateForDownload(req.params.id, {
                actorUserId: req.user?.id || null
            });
            await downloadFile(res, fileInfo, req.user, 'onboarding-template', {
                resourceId: req.params.id
            });
        } catch (error) {
            next(error);
        }
    });
    router.get('/organization/:organizationId', onboardingDocumentsController.getByOrganization);
    router.post('/', uploadOnboardingTemplate, onboardingDocumentsController.create);
    router.put('/:id', onboardingDocumentsController.update);
    router.delete('/:id', onboardingDocumentsController.delete);

    // Job role document assignment routes
    router.get('/job-role/:jobRoleId', onboardingDocumentsController.getDocumentsByJobRole);
    router.post('/job-role/:jobRoleId/assign', onboardingDocumentsController.assignToJobRole);
    router.put('/job-role/:jobRoleId/documents/:documentId', onboardingDocumentsController.updateJobRoleAssignment);
    router.delete('/job-role/:jobRoleId/documents/:documentId', onboardingDocumentsController.removeFromJobRole);

    // Admin user document management routes
    router.put('/user-documents/:userDocumentId/status', onboardingDocumentsController.updateUserDocumentStatusAdmin);
    router.get('/employees/:employeeId/documents/:documentId/download', async (req, res, next) => {
        try {
            const { employeeId, documentId } = req.params;
            const fileInfo = await onboardingDocumentsService.getEmployeeDocumentForDownload(employeeId, documentId, {
                actorUserId: req.user?.id || null
            });

            await streamFile(res, fileInfo, req.user, 'employee-document', {
                resourceId: documentId,
                metadata: {
                    employeeId
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // Document template management routes
    router.post('/templates', onboardingDocumentsController.createTemplate);
    router.put('/:id/file', uploadOnboardingTemplate, onboardingDocumentsController.uploadTemplateFile);

    // Workflow document attachment routes
    router.get('/workflows/:id/documents', onboardingDocumentsController.getWorkflowDocuments);
    router.post('/workflows/:id/documents', onboardingDocumentsController.attachDocumentToWorkflow);
    router.put('/workflows/:workflowId/documents/:documentId', onboardingDocumentsController.updateWorkflowDocumentAttachment);
    router.delete('/workflows/:workflowId/documents/:documentId', onboardingDocumentsController.removeDocumentFromWorkflow);

    // Step document attachment routes
    router.get('/steps/:stepId/documents', onboardingDocumentsController.getStepDocuments);
    router.post('/steps/:stepId/documents', onboardingDocumentsController.attachDocumentToStep);
    router.delete('/steps/:stepId/documents/:documentId', onboardingDocumentsController.removeDocumentFromStep);

    return router;
};
