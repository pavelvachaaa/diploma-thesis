const createInternalUsersStoreProxy = require('../../../../../src/shared/contracts/runtime/proxies/internalUsers/internalUsersStore.proxy');

describe('internalUsersStore runtime proxy', () => {
    it('delegates persistence reads and writes through the adapter contract', async () => {
        const internalUsersStoreAdapter = {
            findLocalUserByEmail: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' }),
            findLocalUsersByEmails: jest.fn().mockResolvedValue([{ id: 'user-1', email: 'user@example.com' }]),
            getOrganizationBySeatLocation: jest.fn().mockResolvedValue({ id: 'org-1', seat_location: 'CE' }),
            getOrganizationsBySeatLocations: jest.fn().mockResolvedValue([{ id: 'org-1', seat_location: 'CE' }]),
            createLocalInternalUser: jest.fn().mockResolvedValue({ id: 'user-2', email: 'new@example.com' }),
            updateLocalUserProfile: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Updated' })
        };
        const proxy = createInternalUsersStoreProxy({ internalUsersStoreAdapter });

        await proxy.findLocalUserByEmail('user@example.com', { client: { query: jest.fn() } });
        await proxy.findLocalUsersByEmails(['user@example.com'], { client: { query: jest.fn() } });
        await proxy.getOrganizationBySeatLocation('CE', { client: { query: jest.fn() } });
        await proxy.getOrganizationsBySeatLocations(['CE'], { client: { query: jest.fn() } });
        await proxy.createLocalInternalUser({ email: 'new@example.com' }, { client: { query: jest.fn() } });
        await proxy.updateLocalUserProfile('user-1', { name: 'Updated' }, { client: { query: jest.fn() } });

        expect(internalUsersStoreAdapter.findLocalUserByEmail).toHaveBeenCalledWith(
            'user@example.com',
            { client: { query: expect.any(Function) } }
        );
        expect(internalUsersStoreAdapter.findLocalUsersByEmails).toHaveBeenCalledWith(
            ['user@example.com'],
            { client: { query: expect.any(Function) } }
        );
        expect(internalUsersStoreAdapter.getOrganizationBySeatLocation).toHaveBeenCalledWith(
            'CE',
            { client: { query: expect.any(Function) } }
        );
        expect(internalUsersStoreAdapter.getOrganizationsBySeatLocations).toHaveBeenCalledWith(
            ['CE'],
            { client: { query: expect.any(Function) } }
        );
        expect(internalUsersStoreAdapter.createLocalInternalUser).toHaveBeenCalledWith(
            { email: 'new@example.com' },
            { client: { query: expect.any(Function) } }
        );
        expect(internalUsersStoreAdapter.updateLocalUserProfile).toHaveBeenCalledWith(
            'user-1',
            { name: 'Updated' },
            { client: { query: expect.any(Function) } }
        );
    });
});
