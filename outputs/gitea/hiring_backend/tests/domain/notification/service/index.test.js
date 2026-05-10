const createNotificationService = require('../../../../src/core/notification/application');

const buildDependencies = ({
    settings = { email: true, inApp: true, hasPreferences: true },
    sendNotificationEmail = jest.fn().mockResolvedValue({ success: true, skipped: false }),
    insertNotification = jest.fn().mockResolvedValue({ id: 'notif-1' })
} = {}) => {
    const notificationStorePort = {
        insertNotification,
        getUsersByRoleInOrganization: jest.fn(),
        listByUser: jest.fn(),
        unreadCount: jest.fn(),
        markRead: jest.fn(),
        markAllRead: jest.fn(),
        getPreferences: jest.fn(),
        updatePreferences: jest.fn(),
        getTypePreferences: jest.fn(),
        updateTypePreferences: jest.fn()
    };

    notificationStorePort.getPreferences.mockResolvedValue({
        inAppEnabled: settings.inApp,
        emailEnabled: settings.email,
        updatedAt: null
    });
    notificationStorePort.getTypePreferences.mockResolvedValue({
        inAppEnabled: null,
        emailEnabled: null,
        updatedAt: null
    });

    const notificationUrlResolverPort = {
        generateNotificationUrl: jest.fn().mockResolvedValue('/employee/notifications')
    };

    const notificationEmailSenderPort = sendNotificationEmail
        ? { sendNotificationEmail }
        : undefined;

    const notificationAuditPort = {
        recordUserNotificationCreated: jest.fn(),
        recordRoleBroadcastSent: jest.fn(),
        recordPreferencesUpdated: jest.fn(),
        recordTypePreferencesUpdated: jest.fn(),
        recordAllNotificationsRead: jest.fn()
    };

    return {
        notificationRepository: notificationStorePort,
        notificationAuditPort,
        service: createNotificationService({
            notificationStorePort,
            notificationUrlResolverPort,
            notificationEmailSenderPort,
            notificationAuditPort
        })
    };
};

describe('core/notification application', () => {
    it('emits audit event when a user notification is inserted', async () => {
        const { service, notificationAuditPort } = buildDependencies();

        await service.notifyUser({
            userId: 'user-1',
            type: 'chat.message',
            title: 'New message',
            body: 'hi'
        });

        expect(notificationAuditPort.recordUserNotificationCreated).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'Notification.UserNotificationCreated',
                notificationId: 'notif-1',
                userId: 'user-1',
                notificationType: 'chat.message'
            })
        );
    });

    it('emits audit event after updating preferences', async () => {
        const { service, notificationRepository, notificationAuditPort } = buildDependencies();
        notificationRepository.updatePreferences.mockResolvedValue({
            inAppEnabled: true,
            emailEnabled: false,
            updatedAt: new Date('2025-01-01')
        });

        await service.updatePreferences('user-1', { inAppEnabled: true, emailEnabled: false });

        expect(notificationAuditPort.recordPreferencesUpdated).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'Notification.PreferencesUpdated',
                userId: 'user-1',
                inAppEnabled: true,
                emailEnabled: false
            })
        );
    });

    it('emits audit event when markAllAsRead affects rows', async () => {
        const { service, notificationRepository, notificationAuditPort } = buildDependencies();
        notificationRepository.markAllRead.mockResolvedValue(4);

        await service.markAllAsRead('user-1');

        expect(notificationAuditPort.recordAllNotificationsRead).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'Notification.AllRead',
                userId: 'user-1',
                count: 4
            })
        );
    });

    it('skips markAllAsRead audit event when nothing changed', async () => {
        const { service, notificationRepository, notificationAuditPort } = buildDependencies();
        notificationRepository.markAllRead.mockResolvedValue(0);

        await service.markAllAsRead('user-1');

        expect(notificationAuditPort.recordAllNotificationsRead).not.toHaveBeenCalled();
    });

    it('sendDualChannelNotification uses injected emailNotificationSender', async () => {
        const sendNotificationEmail = jest.fn().mockResolvedValue({
            success: true,
            skipped: false
        });
        const { service, notificationRepository } = buildDependencies({
            sendNotificationEmail
        });

        const result = await service.sendDualChannelNotification({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved',
            body: 'Document approved',
            data: { documentId: 'doc-1' },
            actionUrl: '/employee/documents/doc-1'
        });

        expect(notificationRepository.insertNotification).toHaveBeenCalledTimes(1);
        expect(sendNotificationEmail).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved'
        }));

        expect(result.inApp.sent).toBe(true);
        expect(result.email.sent).toBe(true);
    });

    it('skips email channel when user preferences disable it', async () => {
        const sendNotificationEmail = jest.fn();
        const { service, notificationRepository } = buildDependencies({
            settings: { email: false, inApp: true, hasPreferences: true },
            sendNotificationEmail
        });

        const result = await service.sendDualChannelNotification({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved',
            body: 'Document approved'
        });

        expect(notificationRepository.insertNotification).toHaveBeenCalledTimes(1);
        expect(sendNotificationEmail).not.toHaveBeenCalled();
        expect(result.inApp.sent).toBe(true);
        expect(result.email).toEqual(expect.objectContaining({
            sent: false,
            skipped: true,
            reason: 'User preferences disabled'
        }));
    });

    it('skips in-app channel when user preferences disable it', async () => {
        const sendNotificationEmail = jest.fn().mockResolvedValue({
            success: true,
            skipped: false
        });
        const { service, notificationRepository } = buildDependencies({
            settings: { email: true, inApp: false, hasPreferences: true },
            sendNotificationEmail
        });

        const result = await service.sendDualChannelNotification({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved',
            body: 'Document approved'
        });

        expect(notificationRepository.insertNotification).not.toHaveBeenCalled();
        expect(sendNotificationEmail).toHaveBeenCalledTimes(1);
        expect(result.inApp).toEqual(expect.objectContaining({
            sent: false,
            skipped: true,
            reason: 'User preferences disabled'
        }));
        expect(result.email.sent).toBe(true);
    });

    it('returns per-channel error when one channel fails and the other succeeds', async () => {
        const sendNotificationEmail = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
        const { service, notificationRepository } = buildDependencies({
            sendNotificationEmail
        });

        const result = await service.sendDualChannelNotification({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved',
            body: 'Document approved'
        });

        expect(notificationRepository.insertNotification).toHaveBeenCalledTimes(1);
        expect(result.inApp.sent).toBe(true);
        expect(result.email).toEqual(expect.objectContaining({
            sent: false,
            skipped: false,
            error: 'SMTP unavailable'
        }));
    });

    it('returns channel-local error when email sender dependency is missing', async () => {
        const { service, notificationRepository } = buildDependencies({
            sendNotificationEmail: null
        });

        const result = await service.sendDualChannelNotification({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved',
            body: 'Document approved'
        });

        expect(notificationRepository.insertNotification).toHaveBeenCalledTimes(1);
        expect(result.inApp.sent).toBe(true);
        expect(result.email).toEqual(expect.objectContaining({
            sent: false,
            skipped: false,
            error: expect.any(String)
        }));
        expect(result).toEqual(expect.objectContaining({
            hasPreferences: true,
            inApp: expect.any(Object),
            email: expect.any(Object)
        }));
    });
});
