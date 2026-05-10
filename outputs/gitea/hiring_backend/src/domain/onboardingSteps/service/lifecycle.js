const HttpError = require('@shared/errors/HttpError');
const { validateStepCompletion } = require('./shared/validation');

module.exports = ({ onboardingStepsRepository, onboardingStepsEvents }) => {
    const queueCompletionNotifications = async ({
        client,
        userId,
        userStepId,
        onboardingStepId,
        stepTitle,
        stepType,
        isAcknowledgmentStep = false
    }) => {
        const userOrg = await onboardingStepsRepository.getUserOrganization(userId, { client });
        const organizationId = userOrg?.organization_id || null;

        if (!organizationId) {
            return;
        }

        await onboardingStepsEvents.queueStepCompletedNotification({
            client,
            organizationId,
            userId,
            userStepId,
            onboardingStepId,
            stepTitle,
            stepType,
            isAcknowledgmentStep
        });

        const pendingSteps = await onboardingStepsRepository.getPendingMandatorySteps(userId, { client });
        if (pendingSteps.length === 0) {
            await onboardingStepsEvents.queueOnboardingCompletedNotification({
                client,
                organizationId,
                userId,
                sourceUserStepId: userStepId
            });
        }
    };

    const startStep = async (userStepId, userId) => {
        const userStep = await onboardingStepsRepository.findUserStepById(userStepId, userId);

        if (!userStep) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        if (userStep.status !== 'not_started') {
            return { userStep: { id: userStep.id, status: userStep.status } };
        }

        const updatedStep = await onboardingStepsRepository.updateUserStepStatus(userStepId, 'in_progress');
        return { userStep: updatedStep };
    };

    const acknowledgeStep = async (userStepId, userId, acknowledged) => {
        const userStep = await onboardingStepsRepository.findUserStepById(userStepId, userId);

        if (!userStep) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        if (userStep.step_type !== 'ack' && !userStep.acknowledgment_text) {
            throw new HttpError('Tento krok nevyžaduje potvrzení', 400);
        }

        if (!(userStep.step_type === 'ack' && acknowledged)) {
            const updatedStep = await onboardingStepsRepository.updateUserStepAcknowledgment(userStepId, acknowledged);
            return { userStep: updatedStep };
        }

        const updatedStep = await onboardingStepsRepository.withTransaction(async (client) => {
            const completedStep = await onboardingStepsRepository.updateUserStepStatus(
                userStepId,
                'completed',
                {
                    acknowledged,
                    completed_at: new Date()
                },
                { client }
            );

            await queueCompletionNotifications({
                client,
                userId,
                userStepId,
                onboardingStepId: userStep.onboarding_step_id,
                stepTitle: userStep.title,
                stepType: userStep.step_type,
                isAcknowledgmentStep: true
            });

            return completedStep;
        });

        return { userStep: updatedStep };
    };

    const completeStep = async (userStepId, userId) => {
        const userStep = await onboardingStepsRepository.findUserStepById(userStepId, userId);

        if (!userStep) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        await validateStepCompletion({ onboardingStepsRepository, userStep });

        const updatedStep = await onboardingStepsRepository.withTransaction(async (client) => {
            const completedStep = await onboardingStepsRepository.completeUserStep(userStepId, { client });

            await queueCompletionNotifications({
                client,
                userId,
                userStepId,
                onboardingStepId: userStep.onboarding_step_id,
                stepTitle: userStep.title,
                stepType: userStep.step_type,
                isAcknowledgmentStep: false
            });

            return completedStep;
        });

        return { userStep: updatedStep };
    };

    const skipStep = async (userStepId, userId) => {
        const userStep = await onboardingStepsRepository.findUserStepById(userStepId, userId);

        if (!userStep) {
            throw new HttpError('Krok nebyl nalezen nebo k němu nemáte oprávnění', 404);
        }

        const updatedStep = await onboardingStepsRepository.skipUserStep(userStepId);
        return { userStep: updatedStep };
    };

    return {
        startStep,
        acknowledgeStep,
        completeStep,
        skipStep
    };
};
