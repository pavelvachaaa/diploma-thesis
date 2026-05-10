const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/notification/notificationEmailSender.proxy');

describe('NotificationEmailSenderPort runtime proxy', () => {
    it('delegates notification email sending', async () => {
        const notificationEmailSenderAdapter = {
            sendNotificationEmail: jest.fn().mockResolvedValue({ success: true })
        };
        const port = createProxy({ notificationEmailSenderAdapter });

        const result = await port.sendNotificationEmail({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved'
        });

        expect(result).toEqual({ success: true });
        expect(notificationEmailSenderAdapter.sendNotificationEmail).toHaveBeenCalledWith({
            userId: 'user-1',
            email: 'user@example.com',
            type: 'document.approved',
            title: 'Approved'
        });
    });
});
