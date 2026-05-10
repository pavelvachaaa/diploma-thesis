module.exports = ({ sideEffectOutboxService }) => {
    if (!sideEffectOutboxService?.enqueueRoleNotification) {
        throw new Error('sideEffectOutboxService.enqueueRoleNotification dependency is required');
    }

    const queueStepCompletedNotification = async ({
        client,
        organizationId,
        userId,
        userStepId,
        onboardingStepId,
        stepTitle,
        stepType,
        isAcknowledgmentStep = false
    }) => sideEffectOutboxService.enqueueRoleNotification({
        type: 'onboarding.step.completed',
        organizationId,
        title: 'Onboarding step completed',
        body: isAcknowledgmentStep
            ? `Acknowledgment step "${stepTitle || 'Unnamed Step'}" was completed`
            : `Step "${stepTitle || 'Unnamed Step'}" was completed`,
        data: {
            userId,
            stepId: onboardingStepId,
            userStepId,
            stepTitle,
            stepType
        },
        actionUrl: `/admin/employees/${userId}/onboarding/steps/${userStepId}`,
        roleName: 'HR'
    }, {
        client,
        aggregateType: 'onboarding_step',
        aggregateId: userStepId,
        organizationId,
        idempotencyKey: `onboarding.step.completed.${userId}.${userStepId}`
    });

    const queueOnboardingCompletedNotification = async ({
        client,
        organizationId,
        userId,
        sourceUserStepId = null
    }) => sideEffectOutboxService.enqueueRoleNotification({
        type: 'onboarding.completed',
        organizationId,
        title: 'Onboarding dokončen',
        body: 'Zaměstnanec dokončil celý onboarding',
        data: {
            userId,
            userStepId: sourceUserStepId
        },
        roleName: 'HR'
    }, {
        client,
        aggregateType: 'onboarding',
        aggregateId: userId,
        organizationId,
        idempotencyKey: `onboarding.completed.${userId}`
    });

    return {
        queueStepCompletedNotification,
        queueOnboardingCompletedNotification
    };
};
