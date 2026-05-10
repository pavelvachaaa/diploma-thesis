module.exports = ({ onboardingStepsService }) => {
    const { validationResult } = require('express-validator');

    const getStepDetails = async (req, res, next) => {
        try {
            const { userStepId } = req.params;

            if (!req.user?.id) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const stepDetails = await onboardingStepsService.getStepDetails(userStepId, req.user.id);
            res.json(stepDetails);
        } catch (err) {
            next(err);
        }
    };

    const startStep = async (req, res, next) => {
        try {
            const { userStepId } = req.params;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            const result = await onboardingStepsService.startStep(userStepId, userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const acknowledgeStep = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { userStepId } = req.params;
            const { acknowledged } = req.body;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            if (typeof acknowledged !== 'boolean') {
                return res.status(400).json({ error: 'acknowledged must be a boolean value' });
            }

            const result = await onboardingStepsService.acknowledgeStep(userStepId, userId, acknowledged);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const submitForm = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { userStepId } = req.params;
            const { answers } = req.body;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            if (!answers || typeof answers !== 'object') {
                return res.status(400).json({ error: 'answers must be an object' });
            }

            const result = await onboardingStepsService.submitForm(userStepId, userId, answers);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const markDocumentRead = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { userStepId } = req.params;
            const { document_id: documentId } = req.body;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            if (!documentId) {
                return res.status(400).json({ error: 'document_id is required' });
            }

            const result = await onboardingStepsService.markDocumentRead(userStepId, userId, documentId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const completeStep = async (req, res, next) => {
        try {
            const { userStepId } = req.params;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            const result = await onboardingStepsService.completeStep(userStepId, userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const skipStep = async (req, res, next) => {
        try {
            const { userStepId } = req.params;
            const userId = req.user.id;
            const organizationId = req.user.organization_id;

            if (!userId || !organizationId) {
                return res.status(401).json({ error: 'User not authenticated or organization not found' });
            }

            const result = await onboardingStepsService.skipStep(userStepId, userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    return {
        getStepDetails,
        startStep,
        acknowledgeStep,
        submitForm,
        markDocumentRead,
        completeStep,
        skipStep
    };
};
