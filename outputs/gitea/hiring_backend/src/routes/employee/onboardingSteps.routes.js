module.exports = ({ onboardingStepsController, onboardingStepsService, fileDownload }) => {
    const { Router } = require('express');
    const { body } = require('express-validator');
    const { authMiddleware } = require('@middlewares/auth.middleware');
    const { streamFile } = fileDownload;

    const router = Router();

    // Apply authentication to all routes
    router.use(authMiddleware);

    /**
     * GET /api/employee/onboarding/steps/:userStepId
     * Get step details with form, documents, and user progress
     */
    router.get('/:userStepId', onboardingStepsController.getStepDetails);

    /**
     * POST /api/employee/onboarding/steps/:userStepId/start
     * Start a step - set status to in_progress
     */
    router.post('/:userStepId/start', onboardingStepsController.startStep);

    /**
     * POST /api/employee/onboarding/steps/:userStepId/ack
     * Acknowledge a step (for ack type or when acknowledgment_text exists)
     */
    router.post('/:userStepId/ack', [
        body('acknowledged')
            .isBoolean()
            .withMessage('acknowledged must be a boolean value')
    ], onboardingStepsController.acknowledgeStep);

    /**
     * POST /api/employee/onboarding/steps/:userStepId/form
     * Submit form answers
     */
    router.post('/:userStepId/form', [
        body('answers')
            .isObject()
            .withMessage('answers must be an object')
            .notEmpty()
            .withMessage('answers cannot be empty')
    ], onboardingStepsController.submitForm);

    /**
     * POST /api/employee/onboarding/steps/:userStepId/read-document
     * Mark document as read
     */
    router.post('/:userStepId/read-document', [
        body('document_id')
            .isUUID()
            .withMessage('document_id must be a valid UUID')
    ], onboardingStepsController.markDocumentRead);

    /**
     * POST /api/employee/onboarding/steps/:userStepId/complete
     * Complete a step (with validation for required fields, acknowledgments, and mandatory docs)
     */
    router.post('/:userStepId/complete', onboardingStepsController.completeStep);

    /**
     * POST /api/employee/onboarding/steps/:userStepId/skip
     * Skip a step
     */
    router.post('/:userStepId/skip', onboardingStepsController.skipStep);

    /**
     * GET /api/employee/onboarding/steps/documents/:documentId/download
     * Download document attached to a step
     */
    router.get('/documents/:documentId/download', async (req, res, next) => {
        try {
            const { documentId } = req.params;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            const fileInfo = await onboardingStepsService.getDocumentForDownload(documentId, userId);
            await streamFile(res, fileInfo, req.user, 'onboarding-document', {
                resourceId: documentId
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
