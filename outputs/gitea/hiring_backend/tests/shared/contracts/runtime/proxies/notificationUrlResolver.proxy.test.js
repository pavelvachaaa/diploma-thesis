const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/notification/notificationUrlResolver.proxy');

describe('NotificationUrlResolverPort runtime proxy', () => {
    it('delegates URL generation with cloned metadata', async () => {
        const notificationUrlResolverAdapter = {
            generateNotificationUrl: jest.fn().mockResolvedValue('/admin/applicants/app-1')
        };
        const port = createProxy({ notificationUrlResolverAdapter });
        const data = { applicantId: 'app-1' };

        const result = await port.generateNotificationUrl('user-1', 'applicant.new_application', data);

        expect(result).toBe('/admin/applicants/app-1');
        expect(notificationUrlResolverAdapter.generateNotificationUrl).toHaveBeenCalledWith(
            'user-1',
            'applicant.new_application',
            { applicantId: 'app-1' }
        );
    });
});
