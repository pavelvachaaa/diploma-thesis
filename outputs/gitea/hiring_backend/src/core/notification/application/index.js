const createPreferences = require('./preferences');
const createReads = require('./reads');
const createNotifyUser = require('./notifyUser');
const createNotifyRoleInOrg = require('./notifyRoleInOrg');
const createSendDualChannelNotification = require('./sendDualChannelNotification');

module.exports = ({
    notificationStorePort,
    notificationUrlResolverPort,
    notificationEmailSenderPort,
    notificationAuditPort,
    logger
}) => {
    const preferences = createPreferences({ notificationStorePort, notificationAuditPort });
    const reads = createReads({ notificationStorePort, notificationAuditPort });

    const notifyUser = createNotifyUser({
        notificationStorePort,
        notificationAuditPort,
        shouldSendInAppNotification: preferences.shouldSendInAppNotification
    });

    const notifyRoleInOrg = createNotifyRoleInOrg({
        notificationStorePort,
        notificationUrlResolverPort,
        notificationAuditPort,
        notifyUser,
        logger
    });

    const sendDualChannelNotification = createSendDualChannelNotification({
        notificationEmailSenderPort,
        getNotificationSettings: preferences.getNotificationSettings,
        notifyUser
    });

    const generateNotificationUrlForUser = (recipientUserId, type, data = {}) => (
        notificationUrlResolverPort.generateNotificationUrl(recipientUserId, type, data)
    );

    return {
        notifyUser,
        notifyRoleInOrg,
        getUserNotifications: reads.getUserNotifications,
        getUnreadCount: reads.getUnreadCount,
        markAsRead: reads.markAsRead,
        markAllAsRead: reads.markAllAsRead,
        getPreferences: preferences.getPreferences,
        updatePreferences: preferences.updatePreferences,
        getTypePreferences: preferences.getTypePreferences,
        updateTypePreferences: preferences.updateTypePreferences,
        shouldReceiveNotification: preferences.shouldReceiveNotification,
        shouldSendEmailNotification: preferences.shouldSendEmailNotification,
        shouldSendInAppNotification: preferences.shouldSendInAppNotification,
        getNotificationSettings: preferences.getNotificationSettings,
        generateNotificationUrlForUser,
        sendDualChannelNotification
    };
};
