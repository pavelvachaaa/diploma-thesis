const MzcrAccreditationSyncPlan = require('../../../../src/core/mzcrAccreditations/domain/MzcrAccreditationSyncPlan');

describe('MzcrAccreditationSyncPlan', () => {
    it('models the fixed KZ-only accreditation sync scope', () => {
        const plan = MzcrAccreditationSyncPlan.create();

        expect(Object.isFrozen(plan)).toBe(true);
        expect(Object.isFrozen(plan.catalogs)).toBe(true);
        expect(Object.isFrozen(plan.accreditationCategories)).toBe(true);
        expect(plan.targetIco).toBe('25488627');
        expect(plan.catalogs).toEqual(expect.arrayContaining([
            'workplaceTypes',
            'basicTrunks',
            'extensionFields'
        ]));
        expect(plan.accreditationCategories).toEqual(expect.arrayContaining([
            'basicTrunks',
            'theoryBasicTrunks',
            'theorySpecializedTrainings',
            'midwives'
        ]));
    });
});
