const HttpError = require('@shared/errors/HttpError');

module.exports = ({ onboardingStepsRepository }) => {
    const validateFormStructure = (form) => {
        if (!form || typeof form !== 'object') {
            throw new HttpError('Form definition is required', 400);
        }

        if (!form.schemaVersion || !form.id) {
            throw new HttpError('Form must have schemaVersion and id', 400);
        }

        if (!Array.isArray(form.fields)) {
            throw new HttpError('Form fields must be an array', 400);
        }

        const validTypes = ['text', 'number', 'date', 'select', 'checkbox'];

        for (const field of form.fields) {
            if (!field.id || !field.type || !field.label) {
                throw new HttpError(`Field missing required properties: ${JSON.stringify(field)}`, 400);
            }

            if (!validTypes.includes(field.type)) {
                throw new HttpError(
                    `Invalid field type: ${field.type}. Must be one of: ${validTypes.join(', ')}`,
                    400
                );
            }

            if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
                throw new HttpError(`Select field '${field.id}' must have options array`, 400);
            }
        }

        if (form.ui && form.ui.groups) {
            for (const group of form.ui.groups) {
                if (!Array.isArray(group.fieldIds)) {
                    continue;
                }

                for (const fieldId of group.fieldIds) {
                    const fieldExists = form.fields.some((field) => field.id === fieldId);
                    if (!fieldExists) {
                        throw new HttpError(`Group references non-existent field: ${fieldId}`, 400);
                    }
                }
            }
        }

        for (const field of form.fields) {
            if (!field.visibleIf?.field) {
                continue;
            }

            const referencedField = form.fields.find((candidate) => candidate.id === field.visibleIf.field);
            if (!referencedField) {
                throw new HttpError(
                    `Field '${field.id}' visibleIf references non-existent field: ${field.visibleIf.field}`,
                    400
                );
            }
        }
    };

    const getStepForm = async (stepId, options = {}) => onboardingStepsRepository.getStepForm(stepId, options);

    const updateStepForm = async (stepId, form, formStatus = 'published', options = {}) => {
        validateFormStructure(form);
        return onboardingStepsRepository.updateStepForm(stepId, form, formStatus, options);
    };

    const getAllStepForms = async (organizationId, options = {}) => {
        return onboardingStepsRepository.getAllStepForms(organizationId, options);
    };

    const previewForm = async (form) => {
        if (!form || typeof form !== 'object') {
            throw new HttpError('Form definition is required', 400);
        }

        return {
            form,
            preview: true,
            timestamp: new Date().toISOString(),
            fieldCount: Array.isArray(form.fields) ? form.fields.length : 0,
            requiredFields: Array.isArray(form.fields)
                ? form.fields.filter((field) => field.required).length
                : 0
        };
    };

    return {
        getStepForm,
        updateStepForm,
        getAllStepForms,
        previewForm
    };
};
