const createSectionItemsApplication = require('../../src/core/sectionItems/application');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const createDependencies = () => ({
    txClient: {
        query: jest.fn()
    },
    sectionItemsCatalogStorePort: {
        getAllSectionTypes: jest.fn().mockResolvedValue([]),
        getAll: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
        getBySectionType: jest.fn().mockResolvedValue([]),
        ensureCatalogItems: jest.fn().mockResolvedValue([]),
        getById: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'item-1' }),
        update: jest.fn().mockResolvedValue({ id: 'item-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'item-1' }),
        updateOrderIndex: jest.fn().mockResolvedValue(undefined)
    },
    jobRoleSectionItemsStorePort: {
        getByJobRole: jest.fn().mockResolvedValue([]),
        addToJobRole: jest.fn().mockResolvedValue({ id: 'jrsi-1' }),
        updateJobRoleItem: jest.fn().mockResolvedValue({ id: 'jrsi-1' }),
        removeFromJobRole: jest.fn().mockResolvedValue({ id: 'jrsi-1' }),
        replaceJobRoleSectionItems: jest.fn().mockResolvedValue(undefined)
    },
    sectionItemsUnitOfWorkPort: {
        runInTransaction: jest.fn()
    }
});

const createApplication = (deps) => {
    deps.sectionItemsUnitOfWorkPort.runInTransaction.mockImplementation((work) => work(deps.txClient));
    return createSectionItemsApplication(deps);
};

describe('sectionItems.application', () => {
    it('keeps global section_items catalog operations unchanged', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await application.create({
            section_type_name: 'duties',
            item_text: 'Text',
            is_active: true,
            order_index: 0,
            created_at: 'should-not-leak'
        });

        expect(deps.sectionItemsCatalogStorePort.create).toHaveBeenCalledWith({
            section_type_name: 'duties',
            item_text: 'Text',
            is_active: true,
            order_index: 0
        });
    });

    it('updates catalog items without defaulting missing order or active fields', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await application.update('item-1', {
            section_type_name: 'duties',
            item_text: 'Updated text',
            is_active: false,
            order_index: 7,
            ignored: 'field'
        });

        expect(deps.sectionItemsCatalogStorePort.update).toHaveBeenCalledWith('item-1', {
            section_type_name: 'duties',
            item_text: 'Updated text',
            is_active: false,
            order_index: 7
        });
    });

    it('rejects incomplete catalog updates instead of silently resetting defaults', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        expect(() => application.update('item-1', {
            section_type_name: 'duties',
            item_text: 'Updated text'
        })).toThrow(expect.objectContaining({ code: ErrorCode.VALIDATION_ERROR }));

        expect(deps.sectionItemsCatalogStorePort.update).not.toHaveBeenCalled();
    });

    it('passes lookup options through to getBySectionType catalog port call', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await application.getBySectionType('duties', {
            activeOnly: true,
            search: 'péče',
            limit: 5
        });

        expect(deps.sectionItemsCatalogStorePort.getBySectionType).toHaveBeenCalledWith('duties', {
            activeOnly: true,
            search: 'péče',
            limit: 5
        });
    });

    it('defaults lookup options when none are passed and clears unusable limits', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await application.getBySectionType('duties');

        expect(deps.sectionItemsCatalogStorePort.getBySectionType).toHaveBeenCalledWith('duties', {
            activeOnly: true,
            search: '',
            limit: undefined
        });
    });

    it('passes catalog ensure requests through to the catalog port call', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);
        const options = {
            client: {
                query: jest.fn()
            }
        };

        await application.ensureCatalogItems('requirements', [' Empatie ', 'Komunikace'], options);

        expect(deps.sectionItemsCatalogStorePort.ensureCatalogItems).toHaveBeenCalledWith(
            'requirements',
            [' Empatie ', 'Komunikace'],
            options
        );
    });

    it('passes actor options through to getByJobRole repository call', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        const actor = {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        };

        await application.getByJobRole('job-role-1', actor);

        expect(deps.jobRoleSectionItemsStorePort.getByJobRole).toHaveBeenCalledWith('job-role-1', actor);
    });

    it('passes actor options through to addToJobRole repository call', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);
        const actor = {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        };

        await application.addToJobRole('job-role-1', {
            section_type_name: 'duties',
            section_item_id: 'item-1'
        }, actor);

        expect(deps.jobRoleSectionItemsStorePort.addToJobRole).toHaveBeenCalledWith('job-role-1', {
            section_type_name: 'duties',
            section_item_id: 'item-1',
            custom_text: null,
            order_index: 0
        }, actor);
    });

    it('returns null when repository returns null for updateJobRoleItem', async () => {
        const deps = createDependencies();
        deps.jobRoleSectionItemsStorePort.updateJobRoleItem.mockResolvedValueOnce(null);
        const application = createApplication(deps);

        const result = await application.updateJobRoleItem('jrsi-missing', {
            section_type_name: 'duties',
            section_item_id: 'item-1',
            order_index: 0
        }, {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        });

        expect(result).toBeNull();
        expect(deps.jobRoleSectionItemsStorePort.updateJobRoleItem).toHaveBeenCalled();
    });

    it('passes actor options through to updateJobRoleItem repository call', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);
        const actor = {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        };

        await application.updateJobRoleItem('jrsi-1', {
            section_type_name: 'duties',
            section_item_id: 'item-1',
            order_index: 5,
            created_at: 'should-not-leak'
        }, actor);

        expect(deps.jobRoleSectionItemsStorePort.updateJobRoleItem).toHaveBeenCalledWith('jrsi-1', {
            section_type_name: 'duties',
            section_item_id: 'item-1',
            custom_text: null,
            order_index: 5
        }, actor);
    });

    it('rejects incomplete job role section item updates instead of resetting order index', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        expect(() => application.updateJobRoleItem('jrsi-1', {
            section_type_name: 'duties',
            section_item_id: 'item-1'
        }, {
            actorUserId: 'admin-1',
            minAccess: 'write'
        })).toThrow(expect.objectContaining({ code: ErrorCode.VALIDATION_ERROR }));

        expect(deps.jobRoleSectionItemsStorePort.updateJobRoleItem).not.toHaveBeenCalled();
    });

    it('passes actor options through to removeFromJobRole repository call', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);
        const actor = {
            id: 'super-1',
            roles: ['super_admin'],
            organizations: []
        };

        await application.removeFromJobRole('jrsi-1', actor);

        expect(deps.jobRoleSectionItemsStorePort.removeFromJobRole).toHaveBeenCalledWith('jrsi-1', actor);
    });

    it('runs order index updates through the unit-of-work port', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await application.updateOrderIndices([
            { id: 'item-1', order_index: 1 },
            { id: 'item-2', order_index: 2 }
        ]);

        expect(deps.sectionItemsUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(
            expect.any(Function),
            { label: 'sectionItems.updateOrderIndices' }
        );
        expect(deps.sectionItemsCatalogStorePort.updateOrderIndex).toHaveBeenNthCalledWith(
            1,
            'item-1',
            1,
            { client: deps.txClient }
        );
        expect(deps.sectionItemsCatalogStorePort.updateOrderIndex).toHaveBeenNthCalledWith(
            2,
            'item-2',
            2,
            { client: deps.txClient }
        );
    });

    it('runs job role section replacement through the unit-of-work port', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);
        const actor = {
            actorUserId: 'admin-1',
            minAccess: 'write'
        };

        await application.replaceJobRoleSectionItems('job-role-1', 'duties', [
            { section_item_id: 'item-1' }
        ], actor);

        expect(deps.sectionItemsUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(
            expect.any(Function),
            { label: 'sectionItems.replaceJobRoleSectionItems' }
        );
        expect(deps.jobRoleSectionItemsStorePort.replaceJobRoleSectionItems).toHaveBeenCalledWith(
            'job-role-1',
            'duties',
            [{ section_item_id: 'item-1', custom_text: null }],
            {
                ...actor,
                client: deps.txClient
            }
        );
    });

    it('rejects missing catalog item business fields before persistence', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        expect(() => application.create({
            section_type_name: 'duties',
            item_text: ''
        })).toThrow(expect.objectContaining({ code: ErrorCode.VALIDATION_ERROR }));

        expect(deps.sectionItemsCatalogStorePort.create).not.toHaveBeenCalled();
    });

    it('rejects malformed order item lists before opening a transaction', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        expect(() => application.updateOrderIndices(null)).toThrow(expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR
        }));

        expect(deps.sectionItemsUnitOfWorkPort.runInTransaction).not.toHaveBeenCalled();
    });

    it('propagates failed job role replacement ACL checks from the adapter port', async () => {
        const deps = createDependencies();
        deps.jobRoleSectionItemsStorePort.replaceJobRoleSectionItems.mockRejectedValueOnce(
            Object.assign(new Error('Job role not found'), { code: ErrorCode.NOT_FOUND })
        );
        const application = createApplication(deps);

        await expect(application.replaceJobRoleSectionItems('job-role-1', 'duties', [
            { section_item_id: 'item-1' }
        ], {
            actorUserId: 'admin-1',
            minAccess: 'write'
        })).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
    });
});
