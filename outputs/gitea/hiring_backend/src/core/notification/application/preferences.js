const NotificationPreferences = require('@core/notification/domain/NotificationPreferences');
const NotificationEvents = require('@core/notification/domain/events');

module.exports = ({ notificationStorePort, notificationAuditPort }) => {
    const shouldReceiveNotification = async (userId, channel, typeCode = null) => {
        const request = NotificationPreferences.createPreferenceCheck(userId, channel, typeCode);

        try {
            const globalPreferences = await notificationStorePort.getPreferences(request.userId);
            const typePreferences = request.typeCode
                ? await notificationStorePort.getTypePreferences(request.userId, request.typeCode)
                : {};

            return NotificationPreferences.resolveChannelPreference({
                globalPreferences,
                typePreferences,
                channel: request.channel,
                typeCode: request.typeCode
            });
        } catch {
            return true;
        }
    };

    const shouldSendEmailNotification = (userId, typeCode = null) => (
        shouldReceiveNotification(userId, 'email', typeCode)
    );

    const shouldSendInAppNotification = (userId, typeCode = null) => (
        shouldReceiveNotification(userId, 'inApp', typeCode)
    );

    const getNotificationSettings = async (userId, typeCode = null) => {
        const request = NotificationPreferences.createPreferenceLookup(userId, typeCode);

        try {
            const [emailAllowed, inAppAllowed] = await Promise.all([
                shouldReceiveNotification(request.userId, 'email', request.typeCode),
                shouldReceiveNotification(request.userId, 'inApp', request.typeCode)
            ]);

            return {
                email: emailAllowed,
                inApp: inAppAllowed,
                hasPreferences: true
            };
        } catch (error) {
            return {
                email: true,
                inApp: true,
                hasPreferences: false,
                error: error.message
            };
        }
    };

    const getPreferences = async (userId) => {
        const request = NotificationPreferences.createPreferenceLookup(userId);
        return notificationStorePort.getPreferences(request.userId);
    };

    const updatePreferences = async (userId, preferences) => {
        const request = NotificationPreferences.createGlobalUpdate(userId, preferences);
        const updated = await notificationStorePort.updatePreferences(request.userId, request.preferences);

        notificationAuditPort?.recordPreferencesUpdated(
            NotificationEvents.preferencesUpdated({
                userId: request.userId,
                inAppEnabled: request.preferences.inAppEnabled,
                emailEnabled: request.preferences.emailEnabled
            })
        );

        return updated;
    };

    const getTypePreferences = async (userId, typeCode) => {
        const request = NotificationPreferences.createTypePreferenceLookup(userId, typeCode);
        return notificationStorePort.getTypePreferences(request.userId, request.typeCode);
    };

    const updateTypePreferences = async (userId, typeCode, preferences) => {
        const request = NotificationPreferences.createTypeUpdate(userId, typeCode, preferences);
        const updated = await notificationStorePort.updateTypePreferences(
            request.userId,
            request.typeCode,
            request.preferences
        );

        notificationAuditPort?.recordTypePreferencesUpdated(
            NotificationEvents.typePreferencesUpdated({
                userId: request.userId,
                typeCode: request.typeCode,
                inAppEnabled: request.preferences.inAppEnabled,
                emailEnabled: request.preferences.emailEnabled
            })
        );

        return updated;
    };

    return {
        shouldReceiveNotification,
        shouldSendEmailNotification,
        shouldSendInAppNotification,
        getNotificationSettings,
        getPreferences,
        updatePreferences,
        getTypePreferences,
        updateTypePreferences
    };
};
