const createOrganizationsApplication = require('../../src/core/organizations/application');

const createDependencies = () => ({
    organizationStorePort: {},
    organizationFilePort: {},
    organizationFileGcPort: {},
    organizationRebacSyncPort: {},
    organizationUnitOfWorkPort: {}
});

describe('organizations.service API contract', () => {
    it('exposes expected organizations service API surface', () => {
        const service = createOrganizationsApplication(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'create',
            'delete',
            'deleteContactPhoto',
            'getAll',
            'getById',
            'getContactPhotoFileInfo',
            'update',
            'uploadContactPhoto'
        ]);
    });
});
