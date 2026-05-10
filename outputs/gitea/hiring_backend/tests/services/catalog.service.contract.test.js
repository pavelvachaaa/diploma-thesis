const createContractTypesApplication = require('../../src/core/catalog/application/contractTypes');
const createJobRolesApplication = require('../../src/core/catalog/application/jobRoles');
const createDocumentTypesApplication = require('../../src/core/catalog/application/documentTypes');
const createJobPostingStatusesApplication = require('../../src/core/catalog/application/jobPostingStatuses');

describe('catalog service API contracts', () => {
    it('exposes expected contractTypes service API surface', () => {
        const service = createContractTypesApplication({ contractTypesStorePort: {} });

        expect(Object.keys(service).sort()).toEqual([
            'create',
            'delete',
            'getAll',
            'getByCode',
            'update'
        ]);
    });

    it('exposes expected jobRoles service API surface', () => {
        const service = createJobRolesApplication({ jobRolesStorePort: {} });

        expect(Object.keys(service).sort()).toEqual([
            'create',
            'delete',
            'getAll',
            'getAllClassifications',
            'getById',
            'getByOrganization',
            'getUniqueNames',
            'update'
        ]);
    });

    it('exposes expected documentTypes service API surface', () => {
        const service = createDocumentTypesApplication({ documentTypesStorePort: {} });

        expect(Object.keys(service).sort()).toEqual([
            'create',
            'delete',
            'getAll',
            'getById',
            'update'
        ]);
    });

    it('exposes expected jobPostingStatuses service API surface', () => {
        const service = createJobPostingStatusesApplication({ jobPostingStatusesStorePort: {} });

        expect(Object.keys(service).sort()).toEqual([
            'create',
            'delete',
            'getAll',
            'getByCode',
            'update'
        ]);
    });
});
