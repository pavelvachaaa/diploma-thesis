const HttpError = require('@shared/errors/HttpError');

module.exports = ({ onboardingStepsRepository }) => {
    const markDocumentRead = async (userStepId, userId, documentId) => {
        const userStep = await onboardingStepsRepository.findUserStepById(userStepId, userId);

        if (!userStep) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        const isAttached = await onboardingStepsRepository.isDocumentAttachedToStep(userStep.onboarding_step_id, documentId);
        if (!isAttached) {
            throw new HttpError('Dokument nebyl nalezen pro tento krok', 404);
        }

        const currentResponse = await onboardingStepsRepository.getUserStepFormResponse(userStepId);
        const docReads = { ...(currentResponse.docReads || {}) };
        docReads[documentId] = new Date().toISOString();

        const updatedStep = await onboardingStepsRepository.updateUserStepFormResponse(userStepId, {
            ...currentResponse,
            docReads
        });

        return { userStep: updatedStep };
    };

    const getDocumentForDownload = async (documentId, userId) => {
        const document = await onboardingStepsRepository.getDocumentForDownload(documentId, userId);

        if (!document) {
            throw new HttpError('Dokument nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        return document;
    };

    return {
        markDocumentRead,
        getDocumentForDownload
    };
};
