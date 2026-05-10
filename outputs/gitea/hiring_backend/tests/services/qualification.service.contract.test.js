const createQualificationApplication = require('../../src/core/qualification/application');

describe('qualification application contract', () => {
    it('exposes the expected public method surface', () => {
        const application = createQualificationApplication({
            qualificationProviderPort: {
                lookupByWorkerNumber: jest.fn(),
                lookupByBirthNumber: jest.fn()
            },
            qualificationAuditPort: {
                recordLookup: jest.fn()
            }
        });

        expect(Object.keys(application).sort()).toEqual([
            'lookupQualification'
        ]);
    });
});
