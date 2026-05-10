const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/notification/notificationAudit.proxy');

describe('NotificationAuditPort runtime proxy', () => {
    const buildAdapter = () => ({
        recordUserNotificationCreated: jest.fn(),
        recordRoleBroadcastSent: jest.fn(),
        recordPreferencesUpdated: jest.fn(),
        recordTypePreferencesUpdated: jest.fn(),
        recordAllNotificationsRead: jest.fn()
    });

    it('forwards each domain event method to the adapter', async () => {
        const notificationAuditAdapter = buildAdapter();
        const port = createProxy({ notificationAuditAdapter });

        await port.recordUserNotificationCreated({
            type: 'Notification.UserNotificationCreated',
            notificationId: 'notif-1',
            userId: 'user-1',
            notificationType: 'chat.message'
        });
        await port.recordRoleBroadcastSent({
            type: 'Notification.RoleBroadcastSent',
            organizationId: 'org-1',
            roleName: 'HR',
            notificationType: 'job.application_received',
            deliveredCount: 3
        });
        await port.recordPreferencesUpdated({
            type: 'Notification.PreferencesUpdated',
            userId: 'user-1',
            inAppEnabled: true,
            emailEnabled: false
        });
        await port.recordTypePreferencesUpdated({
            type: 'Notification.TypePreferencesUpdated',
            userId: 'user-1',
            typeCode: 'chat.message',
            inAppEnabled: null,
            emailEnabled: true
        });
        await port.recordAllNotificationsRead({
            type: 'Notification.AllRead',
            userId: 'user-1',
            count: 7
        });

        expect(notificationAuditAdapter.recordUserNotificationCreated).toHaveBeenCalledTimes(1);
        expect(notificationAuditAdapter.recordRoleBroadcastSent).toHaveBeenCalledTimes(1);
        expect(notificationAuditAdapter.recordPreferencesUpdated).toHaveBeenCalledTimes(1);
        expect(notificationAuditAdapter.recordTypePreferencesUpdated).toHaveBeenCalledTimes(1);
        expect(notificationAuditAdapter.recordAllNotificationsRead).toHaveBeenCalledTimes(1);
    });

    it('throws at construction when adapter is missing methods', () => {
        expect(() => createProxy({ notificationAuditAdapter: {} })).toThrow();
    });
});
