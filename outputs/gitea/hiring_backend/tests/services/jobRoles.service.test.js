const createJobRolesApplication = require('../../src/core/catalog/application/jobRoles');

describe('jobRoles service', () => {
    it('deduplicates and sorts unique names case/diacritics insensitive', async () => {
        const storePort = {
            getUniqueNames: jest.fn().mockResolvedValue([
                '  Lékaři  ',
                'Sestry a záchranáři',
                'lekari',
                '  sestry   a   zachranari  ',
                '',
                'Nezdravotnické profese'
            ])
        };

        const service = createJobRolesApplication({ jobRolesStorePort: storePort });
        const result = await service.getUniqueNames();

        expect(result).toEqual([
            'Lékaři',
            'Nezdravotnické profese',
            'Sestry a záchranáři'
        ]);
    });
});
