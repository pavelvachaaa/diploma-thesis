module.exports = ({ notificationRepository, logger }) => {
    const assertChannel = (channel) => {
        if (!['email', 'inApp'].includes(channel)) {
            throw new Error('channel must be either "email" or "inApp"');
        }
    };

    const shouldReceiveNotification = async (userId, channel, typeCode = null) => {
        if (!userId || !channel) {
            throw new Error('userId and channel are required');
        }

        assertChannel(channel);

        try {
            const globalPrefs = await notificationRepository.getPreferences(userId);
            const globalEnabled = channel === 'email' ? globalPrefs.emailEnabled : globalPrefs.inAppEnabled;

            if (!globalEnabled) {
                return false;
            }

            if (!typeCode) {
                return globalEnabled;
            }

            const typePrefs = await notificationRepository.getTypePreferences(userId, typeCode);
            const typeEnabled = channel === 'email' ? typePrefs.emailEnabled : typePrefs.inAppEnabled;

            return typeEnabled !== null ? typeEnabled : globalEnabled;
        } catch (error) {
            logger.error('Failed to check notification preferences', {
                error: error.message,
                userId,
                channel,
                typeCode
            });

            logger.warn('Defaulting to sending notification due to preference check failure', {
                userId,
                channel,
                typeCode
            });

            return true;
        }
    };

    const shouldSendEmailNotification = async (userId, typeCode = null) => {
        return shouldReceiveNotification(userId, 'email', typeCode);
    };

    const shouldSendInAppNotification = async (userId, typeCode = null) => {
        return shouldReceiveNotification(userId, 'inApp', typeCode);
    };

    const getNotificationSettings = async (userId, typeCode = null) => {
        if (!userId) {
            throw new Error('userId is required');
        }

        try {
            const [emailAllowed, inAppAllowed] = await Promise.all([
                shouldReceiveNotification(userId, 'email', typeCode),
                shouldReceiveNotification(userId, 'inApp', typeCode)
            ]);

            return {
                email: emailAllowed,
                inApp: inAppAllowed,
                hasPreferences: true
            };
        } catch (error) {
            logger.error('Failed to get notification settings', {
                error: error.message,
                userId,
                typeCode
            });

            return {
                email: true,
                inApp: true,
                hasPreferences: false,
                error: error.message
            };
        }
    };

    return {
        getPreferences: notificationRepository.getPreferences,
        getTypePreferences: notificationRepository.getTypePreferences,
        shouldReceiveNotification,
        shouldSendEmailNotification,
        shouldSendInAppNotification,
        getNotificationSettings
    };
};
