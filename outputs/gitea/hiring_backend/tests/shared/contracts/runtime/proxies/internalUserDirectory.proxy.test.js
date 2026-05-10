const createInternalUserDirectoryProxy = require('../../../../../src/shared/contracts/runtime/proxies/internalUsers/internalUserDirectory.proxy');

describe('internalUserDirectory runtime proxy', () => {
    it('delegates searchUsers to the raw integration adapter', async () => {
        const internalUserDirectoryAdapter = {
            searchUsers: jest.fn().mockResolvedValue([{ id: '272', fullName: 'Pavel Vacha' }])
        };
        const proxy = createInternalUserDirectoryProxy({ internalUserDirectoryAdapter });

        const result = await proxy.searchUsers({ query: 'Pavel' });

        expect(result).toEqual([{ id: '272', fullName: 'Pavel Vacha' }]);
        expect(internalUserDirectoryAdapter.searchUsers).toHaveBeenCalledWith({ query: 'Pavel' });
    });
});
