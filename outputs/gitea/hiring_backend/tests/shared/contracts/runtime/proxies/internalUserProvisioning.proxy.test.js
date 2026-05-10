const createInternalUserProvisioningProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobs/internalUserProvisioning.proxy');

describe('internalUserProvisioning runtime proxy', () => {
    it('delegates ensureLocalUser to internalUsersApplication', async () => {
        const internalUsersApplication = {
            ensureLocalUser: jest.fn().mockResolvedValue({
                user: { id: 'user-1' },
                organization: { id: 'org-1' },
                created: true
            })
        };
        const proxy = createInternalUserProvisioningProxy({ internalUsersApplication });

        await proxy.ensureLocalUser({ email: 'user@example.com' }, { client: { query: jest.fn() } });

        expect(internalUsersApplication.ensureLocalUser).toHaveBeenCalledWith(
            { email: 'user@example.com' },
            { client: { query: expect.any(Function) } }
        );
    });
});
