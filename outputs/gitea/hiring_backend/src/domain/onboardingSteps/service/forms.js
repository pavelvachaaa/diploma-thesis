const HttpError = require('@shared/errors/HttpError');
const { validateFormAnswers } = require('./shared/validation');

module.exports = ({ onboardingStepsRepository }) => {
    const submitForm = async (userStepId, userId, answers) => {
        const stepDetails = await onboardingStepsRepository.getStepDetailsWithForm(userStepId, userId);

        if (!stepDetails) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        const fields = stepDetails.form?.fields || [];
        const validationErrors = validateFormAnswers(fields, answers || {});

        if (validationErrors.length > 0) {
            await onboardingStepsRepository.submitFormResponse(userStepId, answers, 'invalid');
            throw new HttpError('Ověření formuláře selhalo', 400, { details: validationErrors });
        }

        const currentResponse = stepDetails.form_response || {};
        const mergedResponse = {
            ...currentResponse,
            ...answers,
            docReads: currentResponse.docReads || {}
        };

        const updatedStep = await onboardingStepsRepository.submitFormResponse(userStepId, mergedResponse, 'valid');

        return { userStep: updatedStep };
    };

    return {
        submitForm
    };
};
