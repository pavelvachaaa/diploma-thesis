module.exports = ({ onboardingStepsService }) => {
    const { validationResult } = require('express-validator');

    const getStepForm = async (req, res, next) => {
        try {
            const { stepId } = req.params;

            if (!req.user?.organization_id) {
                return res.status(401).json({ error: 'User organization not found' });
            }

            const form = await onboardingStepsService.getStepForm(stepId);

            if (!form) {
                return res.status(404).json({ error: 'Form not found' });
            }

            res.json(form);
        } catch (err) {
            next(err);
        }
    };

    const updateStepForm = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { stepId } = req.params;
            const { form, form_status: formStatus = 'published' } = req.body;

            if (!req.user?.organization_id) {
                return res.status(401).json({ error: 'User organization not found' });
            }

            const updatedStep = await onboardingStepsService.updateStepForm(stepId, form, formStatus);

            if (!updatedStep) {
                return res.status(404).json({ error: 'Step not found' });
            }

            res.json(updatedStep);
        } catch (err) {
            if (err?.statusCode === 400) {
                return res.status(400).json({ error: err.message, ...(err.meta || {}) });
            }

            next(err);
        }
    };

    const getAllStepForms = async (req, res, next) => {
        try {
            if (!req.user?.organization_id) {
                return res.status(401).json({ error: 'User organization not found' });
            }

            const steps = await onboardingStepsService.getAllStepForms(req.user.organization_id);
            res.json({ steps });
        } catch (err) {
            next(err);
        }
    };

    const previewForm = async (req, res, next) => {
        try {
            const { form } = req.body;
            const previewData = await onboardingStepsService.previewForm(form);
            res.json(previewData);
        } catch (err) {
            if (err?.statusCode === 400) {
                return res.status(400).json({ error: err.message });
            }

            next(err);
        }
    };

    return {
        getStepForm,
        updateStepForm,
        getAllStepForms,
        previewForm
    };
};
