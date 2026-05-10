const MzcrAccreditationOrganizationMatch = require('../../../../src/core/mzcrAccreditations/domain/MzcrAccreditationOrganizationMatch');

describe('MzcrAccreditationOrganizationMatch', () => {
    it.each([
        ['Ústí nad Labem', 'UL'],
        ['Usti nad Labem', 'UL'],
        ['Teplice', 'TP'],
        ['Děčín', 'DC'],
        ['Decin', 'DC'],
        ['Chomutov', 'CV'],
        ['Most', 'MO'],
        ['Litoměřice', 'LT'],
        ['Litomerice', 'LT'],
        ['Rumburk', 'RB']
    ])('maps %s to %s', (city, seatLocation) => {
        expect(MzcrAccreditationOrganizationMatch.create({ city })).toEqual({
            city: expect.any(String),
            seatLocation
        });
    });

    it('returns null seat location for unknown city', () => {
        expect(MzcrAccreditationOrganizationMatch.create({ city: 'Praha' })).toEqual({
            city: 'praha',
            seatLocation: null
        });
    });
});
