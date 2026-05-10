const HttpError = require('@shared/errors/HttpError');

const validateFormAnswers = (fields, answers) => {
    const validationErrors = [];
    const fieldMap = new Map(fields.map((field) => [field.id, field]));

    for (const field of fields) {
        if (!field.required) {
            continue;
        }

        const value = answers[field.id];
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            validationErrors.push({
                field: field.id,
                code: 'required',
                message: `Pole '${field.label}' je povinné`
            });
        }
    }

    for (const [fieldId, value] of Object.entries(answers || {})) {
        const field = fieldMap.get(fieldId);
        if (!field) {
            validationErrors.push({
                field: fieldId,
                code: 'unknown_field',
                message: 'Neznámé pole'
            });
            continue;
        }

        if ((value === undefined || value === null || value === '') && !field.required) {
            continue;
        }

        switch (field.type) {
            case 'text': {
                if (typeof value !== 'string') {
                    validationErrors.push({
                        field: fieldId,
                        code: 'invalid_type',
                        message: `Pole '${field.label}' očekává textovou hodnotu`
                    });
                    break;
                }

                if (field.minLength && value.length < field.minLength) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'min_length',
                        message: `Pole '${field.label}' musí mít minimálně ${field.minLength} znaků`
                    });
                }

                if (field.maxLength && value.length > field.maxLength) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'max_length',
                        message: `Pole '${field.label}' může mít maximálně ${field.maxLength} znaků`
                    });
                }
                break;
            }
            case 'number': {
                const numValue = Number(value);
                if (Number.isNaN(numValue)) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'invalid_type',
                        message: `Pole '${field.label}' očekává číselnou hodnotu`
                    });
                    break;
                }

                if (field.min !== undefined && numValue < field.min) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'min_value',
                        message: `Pole '${field.label}' musí být minimálně ${field.min}`
                    });
                }

                if (field.max !== undefined && numValue > field.max) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'max_value',
                        message: `Pole '${field.label}' může být maximálně ${field.max}`
                    });
                }
                break;
            }
            case 'date': {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (typeof value !== 'string' || !dateRegex.test(value)) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'invalid_format',
                        message: `Pole '${field.label}' očekává datum ve formátu YYYY-MM-DD`
                    });
                }
                break;
            }
            case 'select': {
                if (!field.options) {
                    break;
                }

                const validValues = field.options.map((option) => option.value);
                if (!validValues.includes(value)) {
                    validationErrors.push({
                        field: fieldId,
                        code: 'invalid_option',
                        message: `Neplatná možnost pro pole '${field.label}'`
                    });
                }
                break;
            }
            case 'checkbox': {
                if (typeof value !== 'boolean') {
                    validationErrors.push({
                        field: fieldId,
                        code: 'invalid_type',
                        message: `Pole '${field.label}' očekává boolean hodnotu`
                    });
                }
                break;
            }
            default: {
                if (typeof value !== 'string') {
                    validationErrors.push({
                        field: fieldId,
                        code: 'invalid_type',
                        message: `Pole '${field.label}' očekává textovou hodnotu`
                    });
                }
            }
        }
    }

    return validationErrors;
};

const validateStepCompletion = async ({ onboardingStepsRepository, userStep, client = null }) => {
    const errors = [];
    const options = client ? { client } : {};

    if (userStep.step_type === 'ack' && !userStep.acknowledged) {
        errors.push('missing_acknowledgment');
    }

    if (userStep.step_type === 'file') {
        const mandatoryDocs = await onboardingStepsRepository.getMandatoryDocuments(userStep.onboarding_step_id, options);
        const docReads = (userStep.form_response && userStep.form_response.docReads) || {};
        const unreadDocs = [];

        for (const doc of mandatoryDocs) {
            if (!docReads[doc.document_id]) {
                unreadDocs.push({
                    document_id: doc.document_id,
                    name: doc.name
                });
            }
        }

        if (unreadDocs.length > 0) {
            errors.push({ missing_docs: unreadDocs });
        }
    }

    if (userStep.step_type === 'form') {
        const requiredFields = await onboardingStepsRepository.getRequiredFormFields(userStep.onboarding_step_id, options);
        const answers = userStep.form_response || {};
        const missingFields = [];

        for (const field of requiredFields) {
            if (!answers[field.id] || answers[field.id] === '') {
                missingFields.push({
                    field_id: field.id,
                    label: field.label
                });
            }
        }

        if (missingFields.length > 0) {
            errors.push({ missing_form_fields: missingFields });
        }
    }

    const mandatoryDocs = await onboardingStepsRepository.getMandatoryDocuments(userStep.onboarding_step_id, options);
    const docReads = (userStep.form_response && userStep.form_response.docReads) || {};
    const unreadDocs = [];

    for (const doc of mandatoryDocs) {
        if (!docReads[doc.document_id]) {
            unreadDocs.push({
                document_id: doc.document_id,
                name: doc.name
            });
        }
    }

    if (unreadDocs.length > 0) {
        errors.push({ missing_docs: unreadDocs });
    }

    if (errors.length > 0) {
        let message = 'Krok nelze dokončit: ';
        const details = {};

        for (const error of errors) {
            if (error === 'missing_acknowledgment') {
                message += 'Chybí potvrzení. ';
                details.missing_acknowledgment = true;
            } else if (error.missing_form_fields) {
                message += 'Chybí povinná pole formuláře. ';
                details.missing_form_fields = error.missing_form_fields;
            } else if (error.missing_docs) {
                message += 'Nebyly přečteny povinné dokumenty. ';
                details.missing_docs = error.missing_docs;
            }
        }

        throw new HttpError(message.trim(), 409, {
            code: 'STATE_ERROR',
            details
        });
    }
};

module.exports = {
    validateFormAnswers,
    validateStepCompletion
};
