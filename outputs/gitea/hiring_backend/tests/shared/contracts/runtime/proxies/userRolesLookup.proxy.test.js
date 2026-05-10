const createUserRolesLookupProxy = require('../../../../../src/shared/contracts/runtime/proxies/internalUsers/userRolesLookup.proxy');

describe('userRolesLookup runtime proxy', () => {
    it('delegates getUserRoles through the adapter contract', async () => {
        const userRolesLookupAdapter = {
            getUserRoles: jest.fn().mockResolvedValue(['hr', 'admin'])
        };
        const proxy = createUserRolesLookupProxy({ userRolesLookupAdapter });

        const roles = await proxy.getUserRoles('user-1', { client: { query: jest.fn() } });

        expect(roles).toEqual(['hr', 'admin']);
        expect(userRolesLookupAdapter.getUserRoles).toHaveBeenCalledWith(
            'user-1',
            { client: { query: expect.any(Function) } }
        );
    });

    it('throws at construction when adapter is missing methods', () => {
        expect(() => createUserRolesLookupProxy({ userRolesLookupAdapter: {} })).toThrow();
    });
});
