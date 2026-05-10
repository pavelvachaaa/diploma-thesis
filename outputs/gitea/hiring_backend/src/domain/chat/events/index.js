module.exports = ({ sideEffectOutboxService, notificationUrlPort, logger }) => {
    if (!sideEffectOutboxService?.enqueueUserNotification) {
        throw new Error('sideEffectOutboxService.enqueueUserNotification dependency is required');
    }

    if (!notificationUrlPort || typeof notificationUrlPort.generateNotificationUrlForUser !== 'function') {
        throw new Error('notificationUrlPort.generateNotificationUrlForUser dependency is required');
    }

    const buildActionUrl = async ({ recipientId, senderId }) => {
        try {
            const result = await notificationUrlPort.generateNotificationUrlForUser(
                recipientId,
                'chat.message',
                { senderId, peerUserId: senderId }
            );
            return result?.url || null;
        } catch (error) {
            logger.error('Failed to generate chat notification URL', {
                error: error.message,
                recipientId,
                senderId
            });
            return null;
        }
    };

    const enqueueMessageNotification = async ({
        client,
        senderId,
        recipientId,
        messageId,
        body,
        hasAttachments
    }) => {
        const actionUrl = await buildActionUrl({
            recipientId,
            senderId
        });

        const outboxEvent = await sideEffectOutboxService.enqueueUserNotification({
            userId: recipientId,
            type: 'chat.message',
            title: 'New chat message',
            body: body || '(attachment)',
            data: {
                peerUserId: senderId,
                messageId,
                hasAttachments
            },
            actionUrl
        }, {
            client,
            aggregateType: 'chat_message',
            aggregateId: messageId,
            idempotencyKey: `chat.message.notify.${messageId}.${recipientId}`
        });

        return {
            outboxId: outboxEvent?.id || null
        };
    };

    return {
        enqueueMessageNotification
    };
};
