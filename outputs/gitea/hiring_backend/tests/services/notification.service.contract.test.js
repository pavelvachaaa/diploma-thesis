const createNotificationService = require('../../src/core/notification/application');

const createDependencies = () => ({
    notificationStorePort: {},
    notificationUrlResolverPort: {
        generateNotificationUrl: jest.fn()
    },
    notificationEmailSenderPort: {
        sendNotificationEmail: jest.fn()
    },
    notificationAuditPort: {
        recordUserNotificationCreated: jest.fn(),
        recordRoleBroadcastSent: jest.fn(),
        recordPreferencesUpdated: jest.fn(),
        recordTypePreferencesUpdated: jest.fn(),
        recordAllNotificationsRead: jest.fn()
    }
});

describe('notification.service API contract', () => {
    it('exposes expected notification service API surface', () => {
        const service = createNotificationService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'generateNotificationUrlForUser',
            'getNotificationSettings',
            'getPreferences',
            'getTypePreferences',
            'getUnreadCount',
            'getUserNotifications',
            'markAllAsRead',
            'markAsRead',
            'notifyRoleInOrg',
            'notifyUser',
            'sendDualChannelNotification',
            'shouldReceiveNotification',
            'shouldSendEmailNotification',
            'shouldSendInAppNotification',
            'updatePreferences',
            'updateTypePreferences'
        ]);
    });
});
