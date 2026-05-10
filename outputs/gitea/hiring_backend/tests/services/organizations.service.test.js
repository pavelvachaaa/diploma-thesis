const createOrganizationsApplication = require('../../src/core/organizations/application');

const createDependencies = () => ({
    organizationStorePort: {
        getAll: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateContactPhoto: jest.fn(),
        clearContactPhoto: jest.fn(),
        delete: jest.fn()
    },
    organizationFilePort: {
        resolveForDownload: jest.fn(),
        createFileRecord: jest.fn(),
        markRetained: jest.fn()
    },
    organizationFileGcPort: {
        enqueueFileGcDelete: jest.fn()
    },
    organizationRebacSyncPort: {
        enqueueOrganizationSync: jest.fn()
    },
    organizationUnitOfWorkPort: {
        runInTransaction: jest.fn(async (callback) => callback({}))
    }
});

describe('organizations application', () => {
    let originalBaseUrl;

    beforeEach(() => {
        originalBaseUrl = process.env.PUBLIC_S3_BASE_URL;
        process.env.PUBLIC_S3_BASE_URL = 'https://cdn.example.com';
    });

    afterEach(() => {
        if (originalBaseUrl === undefined) {
            delete process.env.PUBLIC_S3_BASE_URL;
        } else {
            process.env.PUBLIC_S3_BASE_URL = originalBaseUrl;
        }
    });

    it('create sanitizes incoming organization payload', async () => {
        const deps = createDependencies();
        deps.organizationStorePort.create.mockResolvedValue({ id: 'org-1' });
        const service = createOrganizationsApplication(deps);

        await service.create({
            name: '  Test Org  ',
            seat_location: '  Praha ',
            address: '  Ulice 1 ',
            contact_email: '  info@example.com ',
            contact_name: '  Jana Nováková  ',
            contact_phone: '  +420 123 456 789  ',
            contact_linkedin_url: '  https://linkedin.com/in/jana  '
        }, { actorRole: 'super_admin' });

        expect(deps.organizationStorePort.create).toHaveBeenCalledWith(
            {
                name: 'Test Org',
                seat_location: 'Praha',
                address: 'Ulice 1',
                contact_email: 'info@example.com',
                contact_name: 'Jana Nováková',
                contact_phone: '+420 123 456 789',
                contact_linkedin_url: 'https://linkedin.com/in/jana'
            },
            { client: expect.any(Object) }
        );
        expect(deps.organizationRebacSyncPort.enqueueOrganizationSync).toHaveBeenCalledWith(
            { id: 'org-1' },
            { client: expect.any(Object) }
        );
    });

    it('create rejects non-super-admin actors', async () => {
        const deps = createDependencies();
        const service = createOrganizationsApplication(deps);

        await expect(
            service.create({ name: 'Test Org' }, { actorRole: 'admin' })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        expect(deps.organizationStorePort.create).not.toHaveBeenCalled();
    });

    it('update sanitizes incoming organization payload', async () => {
        const deps = createDependencies();
        deps.organizationStorePort.update.mockResolvedValue({ id: 'org-1' });
        const service = createOrganizationsApplication(deps);

        await service.update('org-1', {
            name: '  Test Org  ',
            seat_location: '',
            address: '  ',
            contact_email: null,
            contact_name: '  Eliška  ',
            contact_phone: '  723 191530  ',
            contact_linkedin_url: '  '
        }, { actorRole: 'super_admin' });

        expect(deps.organizationStorePort.update).toHaveBeenCalledWith('org-1', {
            name: 'Test Org',
            seat_location: null,
            address: null,
            contact_email: null,
            contact_name: 'Eliška',
            contact_phone: '723 191530',
            contact_linkedin_url: null
        }, {});
    });

    it('getAll passes options through unchanged', async () => {
        const deps = createDependencies();
        deps.organizationStorePort.getAll.mockResolvedValue({
            data: [{
                id: 'org-1',
                name: 'KZ',
                contact_photo_file_id: 'file-1',
                _contact_photo_bucket: 'public-organization-photos',
                _contact_photo_object_key: 'organization-contact-photos/org-1/photo.png'
            }]
        });
        const service = createOrganizationsApplication(deps);

        const options = { page: 1, limit: 20, search: 'KZ', organizationIds: ['org-1'] };
        const result = await service.getAll(options);

        expect(deps.organizationStorePort.getAll).toHaveBeenCalledWith(options);
        expect(result).toEqual({
            data: [{
                id: 'org-1',
                name: 'KZ',
                contact_photo_file_id: 'file-1',
                contact_photo_url: 'https://cdn.example.com/public-organization-photos/organization-contact-photos/org-1/photo.png'
            }]
        });
    });

    it('getById exposes contact_photo_url without leaking storage internals', async () => {
        const deps = createDependencies();
        deps.organizationStorePort.getById.mockResolvedValue({
            id: 'org-1',
            name: 'KZ',
            contact_photo_file_id: 'file-1',
            _contact_photo_bucket: 'public-organization-photos',
            _contact_photo_object_key: 'organization-contact-photos/org-1/photo.png'
        });
        const service = createOrganizationsApplication(deps);

        const result = await service.getById('org-1', { actorUserId: 'actor-1' });

        expect(result).toEqual({
            id: 'org-1',
            name: 'KZ',
            contact_photo_file_id: 'file-1',
            contact_photo_url: 'https://cdn.example.com/public-organization-photos/organization-contact-photos/org-1/photo.png'
        });
        expect(result).not.toHaveProperty('_contact_photo_bucket');
        expect(result).not.toHaveProperty('_contact_photo_object_key');
    });

    it('update applies presentation to the store result without an extra getById roundtrip', async () => {
        const deps = createDependencies();
        deps.organizationStorePort.update.mockResolvedValue({
            id: 'org-1',
            name: 'Updated',
            contact_photo_file_id: 'file-1'
        });
        const service = createOrganizationsApplication(deps);

        const result = await service.update('org-1', { name: 'Updated' }, { actorRole: 'super_admin', actorUserId: 'actor-1' });

        expect(deps.organizationStorePort.update).toHaveBeenCalledWith('org-1', { name: 'Updated' }, { actorUserId: 'actor-1' });
        expect(deps.organizationStorePort.getById).not.toHaveBeenCalled();
        expect(result).toMatchObject({ id: 'org-1', name: 'Updated' });
        // UPDATE RETURNING does not include the files join, so contact_photo_url is null
        expect(result.contact_photo_url).toBe(null);
    });
});
