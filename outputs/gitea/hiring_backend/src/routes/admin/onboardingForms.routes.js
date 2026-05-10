module.exports = ({ onboardingFormsController }) => {
    const { Router } = require('express');
    const { body } = require('express-validator');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_ONLY_ROLES } = require('@shared/auth/roles');

    const router = Router();

    // Apply authentication and admin authorization to all routes
    router.use(authMiddleware);
    router.use(requireAuth(ADMIN_ONLY_ROLES));

    // Get form definition for a step
    router.get('/steps/:stepId/form', onboardingFormsController.getStepForm);

    // Update form definition for a step
    router.put('/steps/:stepId/form', [
        body('form').isObject().withMessage('Form definition must be an object'),
        body('form_status').optional().isIn(['draft', 'published']).withMessage('Form status must be draft or published')
    ], onboardingFormsController.updateStepForm);

    // Get all steps with their forms
    router.get('/steps/forms', onboardingFormsController.getAllStepForms);

    // Preview form
    router.post('/forms/preview', [
        body('form').isObject().withMessage('Form definition must be an object')
    ], onboardingFormsController.previewForm);

    return router;
};
