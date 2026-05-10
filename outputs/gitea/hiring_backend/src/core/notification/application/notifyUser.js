const NotificationCommand = require('@core/notification/domain/NotificationCommand');
const NotificationEvents = require('@core/notification/domain/events');

module.exports = ({
    notificationStorePort,
    notificationAuditPort,
    shouldSendInAppNotification
}) => async (input = {}) => {
    const command = NotificationCommand.createUserNotification(input);

    if (!command.skipPreferences) {
        const shouldSendInApp = await shouldSendInAppNotification(command.userId, command.type);

        if (!shouldSendInApp) {
            return {
                success: true,
                skipped: true,
                reason: 'User in-app preferences disabled',
                userId: command.userId,
                type: command.type,
                title: command.title
            };
        }
    }

    const inserted = await notificationStorePort.insertNotification({
        userId: command.userId,
        type: command.type,
        title: command.title,
        body: command.body,
        data: command.data,
        actionUrl: command.actionUrl
    });

    notificationAuditPort?.recordUserNotificationCreated(
        NotificationEvents.userNotificationCreated({
            notificationId: inserted.id,
            userId: command.userId,
            type: command.type
        })
    );

    return inserted;
};
