module.exports = ({ sideEffectOutboxService }) => {
    const queueRoleNotification = async ({
        client,
        dedupeKey,
        aggregateId,
        organizationId,
        type,
        title,
        body,
        data = {},
        actionUrl = null,
        roleName = 'HR'
    }) => {
        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.ROLE_NOTIFICATION,
            aggregateType: 'applicant',
            aggregateId,
            organizationId,
            payload: {
                type,
                organizationId,
                title,
                body,
                data,
                actionUrl,
                roleName
            }
        }, {
            client,
            idempotencyKey: dedupeKey
        });
    };

    return {
        queueRoleNotification
    };
};
