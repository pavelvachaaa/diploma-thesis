module.exports = ({
    employeeOnboardingController,
    onboardingDocumentsController,
    employeeOnboardingService,
    onboardingDocumentsService,
    fileHandler,
    fileDownload
}) => {
    const { Router } = require('express');
    const { authMiddleware } = require('@middlewares/auth.middleware');
    const { createUploadMiddleware } = fileHandler;
    const { downloadFile, streamFile } = fileDownload;

    const router = Router();
    const uploadUserDocument = createUploadMiddleware('user-documents');

    // Apply authentication middleware to all routes
    router.use(authMiddleware);

    // Employee onboarding routes
    router.get('/dashboard', employeeOnboardingController.getDashboard);
    router.get('/steps', employeeOnboardingController.getSteps);
    router.post('/steps/:userStepId/start', employeeOnboardingController.startStep);
    router.post('/steps/:userStepId/complete', employeeOnboardingController.completeStep);
    router.get('/progress', employeeOnboardingController.getProgress);

    // Document management routes (unified approach)
    router.get('/documents', onboardingDocumentsController.getUserDocuments);
    router.get('/documents/:userDocumentId', onboardingDocumentsController.getUserDocumentById);
    router.post('/documents/:documentId/upload', uploadUserDocument, onboardingDocumentsController.uploadUserDocument);
    router.get('/documents/:userDocumentId/download', async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const fileInfo = await onboardingDocumentsService.getUserDocumentForDownload(
                userId,
                req.params.userDocumentId
            );
            await streamFile(res, fileInfo, req.user, 'user-document', {
                resourceId: req.params.userDocumentId
            });
        } catch (error) {
            next(error);
        }
    });
    router.delete('/documents/:userDocumentId', onboardingDocumentsController.deleteUserDocument);

    // Template download routes
    router.get('/templates/:templateFile', async (req, res, next) => {
        try {
            const fileInfo = await employeeOnboardingService.getTemplateForDownload(req.params.templateFile);
            await downloadFile(res, fileInfo, req.user, 'onboarding-template', {
                resourceId: fileInfo.id || req.params.templateFile,
                metadata: {
                    templateFile: req.params.templateFile
                }
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
