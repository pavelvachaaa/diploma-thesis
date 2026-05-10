const NotificationCommand = require('@core/notification/domain/NotificationCommand');

const buildInitialChannelResult = () => ({
    sent: false,
    skipped: true,
    reason: 'Not attempted'
});

module.exports = ({
    notificationEmailSenderPort,
    getNotificationSettings,
    notifyUser
}) => async (input = {}) => {
    const command = NotificationCommand.createDualChannelNotification(input);
    const settings = command.skipPreferences
        ? { email: true, inApp: true, hasPreferences: false }
        : await getNotificationSettings(command.userId, command.type);

    const results = {
        hasPreferences: settings.hasPreferences,
        inApp: buildInitialChannelResult(),
        email: buildInitialChannelResult()
    };

    if (settings.inApp === true) {
        try {
            const notification = await notifyUser({
                userId: command.userId,
                type: command.type,
                title: command.title,
                body: command.body,
                data: command.data,
                actionUrl: command.actionUrl,
                skipPreferences: true
            });

            results.inApp = {
                sent: true,
                skipped: false,
                notification
            };
        } catch (error) {
            results.inApp = {
                sent: false,
                skipped: false,
                error: error.message
            };
        }
    } else {
        results.inApp.reason = 'User preferences disabled';
    }

    if (settings.email === true) {
        try {
            const result = await notificationEmailSenderPort.sendNotificationEmail({
                userId: command.userId,
                email: command.email,
                type: command.type,
                title: command.title,
                body: command.body,
                data: command.data
            });

            results.email = {
                sent: result.success && !result.skipped,
                skipped: result.skipped || false,
                result
            };
        } catch (error) {
            results.email = {
                sent: false,
                skipped: false,
                error: error.message
            };
        }
    } else {
        results.email.reason = 'User preferences disabled';
    }

    return results;
};
