const HttpError = require('@shared/errors/HttpError');
const { toStepDetailsResponse, toStepDetailsForEmployeeResponse } = require('./shared/mappers');

module.exports = ({ onboardingStepsRepository }) => {
    const getStepDetails = async (userStepId, userId) => {
        const stepDetails = await onboardingStepsRepository.getStepDetailsWithForm(userStepId, userId);

        if (!stepDetails) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        const documents = await onboardingStepsRepository.getStepDocuments(stepDetails.onboarding_step_id);

        return toStepDetailsResponse(stepDetails, documents);
    };

    const getStepDetailsForEmployee = async (userStepId, employeeId) => {
        const stepDetails = await onboardingStepsRepository.getStepDetailsWithFormForEmployee(userStepId, employeeId);

        if (!stepDetails) {
            throw new HttpError('Krok nebyl nalezen pro tohoto zaměstnance', 404);
        }

        const documents = await onboardingStepsRepository.getStepDocuments(stepDetails.onboarding_step_id);

        return toStepDetailsForEmployeeResponse(stepDetails, documents, employeeId);
    };

    return {
        getStepDetails,
        getStepDetailsForEmployee
    };
};
