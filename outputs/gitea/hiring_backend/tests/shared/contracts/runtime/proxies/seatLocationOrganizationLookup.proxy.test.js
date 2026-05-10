const createSeatLocationOrganizationLookupProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/seatLocationOrganizationLookup.proxy');

describe('seatLocationOrganizationLookup runtime proxy', () => {
    it('delegates organization lookup to internalUsersApplication', async () => {
        const internalUsersApplication = {
            getOrganizationBySeatLocation: jest.fn().mockResolvedValue({
                id: 'org-1',
                name: 'Centrum',
                seat_location: 'CE'
            })
        };
        const proxy = createSeatLocationOrganizationLookupProxy({ internalUsersApplication });

        const result = await proxy.getOrganizationBySeatLocation('CE', { client: { query: jest.fn() } });

        expect(result).toEqual({
            id: 'org-1',
            name: 'Centrum',
            seat_location: 'CE'
        });
        expect(internalUsersApplication.getOrganizationBySeatLocation).toHaveBeenCalledWith(
            'CE',
            { client: { query: expect.any(Function) } }
        );
    });
});
