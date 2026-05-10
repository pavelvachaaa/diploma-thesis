const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekers/jobSeekersOrganizationLookup.proxy');

describe('JobSeekersOrganizationLookupPort runtime proxy', () => {
    it('delegates organization lookups through the strict port', async () => {
        const jobSeekersOrganizationLookupAdapter = {
            getById: jest.fn().mockResolvedValue({ id: 'org-1', name: 'KZ' })
        };
        const port = createProxy({ jobSeekersOrganizationLookupAdapter });

        await expect(port.getById('org-1')).resolves.toEqual({ id: 'org-1', name: 'KZ' });

        expect(jobSeekersOrganizationLookupAdapter.getById).toHaveBeenCalledWith('org-1');
    });
});
