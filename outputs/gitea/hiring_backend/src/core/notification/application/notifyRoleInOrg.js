const NotificationCommand = require('@core/notification/domain/NotificationCommand');
const NotificationEvents = require('@core/notification/domain/events');

module.exports = ({
    notificationStorePort,
    notificationUrlResolverPort,
    notificationAuditPort,
    notifyUser,
    logger
}) => async (input = {}) => {
    const command = NotificationCommand.createRoleBroadcast(input);
    const userIds = await notificationStorePort.getUsersByRoleInOrganization(
        command.organizationId,
        command.roleName
    );

    if (userIds.length === 0) {
        return [];
    }

    const notifications = [];

    for (const userId of userIds) {
        try {
            const userActionUrl = command.actionUrl && command.actionUrl.includes('/admin/')
                ? await notificationUrlResolverPort.generateNotificationUrl(userId, command.type, command.data)
                : command.actionUrl;

            const result = await notifyUser({
                userId,
                type: command.type,
                title: command.title,
                body: command.body,
                data: command.data,
                actionUrl: userActionUrl,
                skipPreferences: false
            });

            if (!result.skipped) {
                notifications.push(result);
            }
        } catch (err) {
            logger?.warn?.('Role broadcast recipient failed', {
                userId,
                type: command.type,
                error: err.message
            });
        }
    }

    notificationAuditPort?.recordRoleBroadcastSent(
        NotificationEvents.roleBroadcastSent({
            organizationId: command.organizationId,
            roleName: command.roleName,
            type: command.type,
            deliveredCount: notifications.length
        })
    );

    return notifications;
};
