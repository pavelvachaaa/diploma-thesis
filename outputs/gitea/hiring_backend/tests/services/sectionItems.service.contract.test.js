const createSectionItemsApplication = require('../../src/core/sectionItems/application');

const createDependencies = () => ({
    sectionItemsCatalogStorePort: {},
    jobRoleSectionItemsStorePort: {},
    sectionItemsUnitOfWorkPort: {}
});

describe('sectionItems.application API contract', () => {
    it('exposes expected sectionItems application API surface', () => {
        const application = createSectionItemsApplication(createDependencies());

        expect(Object.keys(application).sort()).toEqual([
            'addToJobRole',
            'create',
            'delete',
            'ensureCatalogItems',
            'getAll',
            'getAllSectionTypes',
            'getById',
            'getByJobRole',
            'getBySectionType',
            'removeFromJobRole',
            'replaceJobRoleSectionItems',
            'update',
            'updateJobRoleItem',
            'updateOrderIndices'
        ]);
    });
});
