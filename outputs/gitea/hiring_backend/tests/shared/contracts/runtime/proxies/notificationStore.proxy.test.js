const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/notification/notificationStore.proxy');

describe('NotificationStorePort runtime proxy', () => {
    const createAdapter = () => ({
        insertNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        listByUser: jest.fn().mockResolvedValue([{ id: 'notif-1' }]),
        unreadCount: jest.fn().mockResolvedValue(1),
        markRead: jest.fn().mockResolvedValue(true),
        markAllRead: jest.fn().mockResolvedValue(2),
        getUsersByRoleInOrganization: jest.fn().mockResolvedValue(['user-1']),
        getPreferences: jest.fn().mockResolvedValue({ inAppEnabled: true, emailEnabled: false }),
        updatePreferences: jest.fn().mockResolvedValue({ inAppEnabled: true, emailEnabled: true }),
        getTypePreferences: jest.fn().mockResolvedValue({ inAppEnabled: null, emailEnabled: null }),
        updateTypePreferences: jest.fn().mockResolvedValue({ inAppEnabled: true, emailEnabled: null })
    });

    it('delegates store operations through the strict port', async () => {
        const notificationStoreAdapter = createAdapter();
        const port = createProxy({ notificationStoreAdapter });

        await port.insertNotification({ userId: 'user-1', type: 'chat.message', title: 'Hi' });
        await port.listByUser({ userId: 'user-1', limit: 10 });
        await port.unreadCount('user-1');
        await port.markRead('notif-1', 'user-1');
        await port.markAllRead('user-1');
        await port.getUsersByRoleInOrganization('org-1', 'HR');
        await port.getPreferences('user-1');
        await port.updatePreferences('user-1', { inAppEnabled: true, emailEnabled: true });
        await port.getTypePreferences('user-1', 'chat.message');
        await port.updateTypePreferences('user-1', 'chat.message', { inAppEnabled: true, emailEnabled: null });

        expect(notificationStoreAdapter.insertNotification).toHaveBeenCalledWith(
            { userId: 'user-1', type: 'chat.message', title: 'Hi' },
            {}
        );
        expect(notificationStoreAdapter.markRead).toHaveBeenCalledWith('notif-1', 'user-1', {});
        expect(notificationStoreAdapter.updateTypePreferences).toHaveBeenCalledWith(
            'user-1',
            'chat.message',
            { inAppEnabled: true, emailEnabled: null },
            {}
        );
    });
});
