const createMzcrAccreditationsApplication = require('../../src/core/mzcrAccreditations/application');
const MzcrAccreditationSyncPlan = require('../../src/core/mzcrAccreditations/domain/MzcrAccreditationSyncPlan');

const createSourcePort = () => ({
    fetchCatalog: jest.fn(async () => []),
    fetchAccreditations: jest.fn(async () => []),
    fetchWorkplace: jest.fn()
});

const createStorePort = () => ({
    markExpiredRunningRuns: jest.fn().mockResolvedValue({ failed: 0 }),
    startSyncRun: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        status: 'running'
    }),
    findOrganizationsBySeatLocations: jest.fn().mockResolvedValue([]),
    listAccreditations: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
    getAccreditationMeta: jest.fn().mockResolvedValue({ specialtyTypes: [] }),
    commitSuccessfulSync: jest.fn(async (payload) => ({
        runId: payload.runId,
        status: 'success',
        summary: payload.summary
    })),
    failSyncRun: jest.fn().mockResolvedValue(undefined),
    getSyncState: jest.fn().mockResolvedValue(null)
});

describe('MZCR accreditations application', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses default KZ ICO and deduplicates category accreditation rows', async () => {
        const plan = MzcrAccreditationSyncPlan.create();
        const source = createSourcePort();
        const store = createStorePort();
        const now = jest.fn()
            .mockReturnValueOnce(new Date('2026-01-01T10:00:00Z'))
            .mockReturnValueOnce(new Date('2026-01-01T10:05:00Z'));
        const application = createMzcrAccreditationsApplication({
            mzcrAccreditationSourcePort: source,
            mzcrAccreditationStorePort: store
        }, {
            now,
            workplaceConcurrency: 1
        });

        source.fetchCatalog.mockImplementation(async ({ catalog }) => (
            catalog === 'workplaceTypes'
                ? [{ id_pracoviste_typ: 3, name: 'II. typ' }]
                : []
        ));
        source.fetchAccreditations.mockImplementation(async ({ category }) => {
            if (category === 'basicTrunks') {
                return [{
                    id_akreditace: 100,
                    pracoviste_id: 24871,
                    pracovisteTypy: [{ id_pracoviste_typ: 3, name: 'II. typ' }]
                }];
            }

            if (category === 'specializedTrainings') {
                return [{
                    id_akreditace: 100,
                    pracoviste_id: 24871,
                    vycvik_id: 3,
                    source_only_field: 'must be preserved for raw JSON'
                }, {
                    id_akreditace: 101,
                    pracoviste_id: 24872,
                    vycvik_id: 4
                }, {
                    id_akreditace: 102,
                    pracoviste_id: 24873,
                    vycvik_id: 5
                }];
            }

            return [];
        });
        source.fetchWorkplace.mockImplementation(async ({ workplaceId }) => {
            const cities = {
                24871: 'Ústí nad Labem',
                24872: 'Teplice',
                24873: 'Praha'
            };

            return {
                id_pracoviste: workplaceId,
                city: cities[workplaceId]
            };
        });
        store.findOrganizationsBySeatLocations.mockResolvedValue([{
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            seatLocation: 'UL'
        }, {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            seatLocation: 'TP'
        }]);

        await application.syncMzcrAccreditations();

        expect(source.fetchAccreditations).toHaveBeenCalledTimes(plan.accreditationCategories.length);
        expect(source.fetchAccreditations).toHaveBeenCalledWith(expect.objectContaining({
            targetIco: '25488627'
        }));
        expect(source.fetchCatalog).toHaveBeenCalledTimes(plan.catalogs.length);
        expect(source.fetchWorkplace).toHaveBeenCalledWith({ workplaceId: 24871 });
        expect(source.fetchWorkplace).toHaveBeenCalledWith({ workplaceId: 24872 });
        expect(source.fetchWorkplace).toHaveBeenCalledWith({ workplaceId: 24873 });
        expect(store.findOrganizationsBySeatLocations).toHaveBeenCalledWith({
            seatLocations: ['TP', 'UL']
        });

        const commitPayload = store.commitSuccessfulSync.mock.calls[0][0];
        expect(commitPayload).not.toHaveProperty('targetIco');
        expect(commitPayload).not.toHaveProperty('providers');
        expect(commitPayload).not.toHaveProperty('workplaces');
        expect(commitPayload.accreditations).toHaveLength(3);
        expect(commitPayload.accreditations.find((row) => row.id_akreditace === 100).sourceCategoryCodes)
            .toEqual(['basicTrunks', 'specializedTrainings']);
        expect(commitPayload.accreditations.find((row) => row.id_akreditace === 100).organization_id)
            .toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
        expect(commitPayload.accreditations.find((row) => row.id_akreditace === 101).organization_id)
            .toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
        expect(commitPayload.accreditations.find((row) => row.id_akreditace === 102).organization_id)
            .toBeNull();
        expect(commitPayload.summary).toEqual({
            catalogsCount: 1,
            accreditationsCount: 3
        });
    });

    it('marks run failed when source collection fails', async () => {
        const source = createSourcePort();
        const store = createStorePort();
        const application = createMzcrAccreditationsApplication({
            mzcrAccreditationSourcePort: source,
            mzcrAccreditationStorePort: store
        }, {
            now: () => new Date('2026-01-01T10:00:00Z')
        });
        source.fetchCatalog.mockRejectedValue(new Error('source down'));

        await expect(application.syncMzcrAccreditations())
            .rejects.toThrow('source down');

        expect(store.failSyncRun).toHaveBeenCalledWith(expect.objectContaining({
            runId: '11111111-1111-4111-8111-111111111111',
            errorMessage: 'source down'
        }));
        expect(store.commitSuccessfulSync).not.toHaveBeenCalled();
    });

    it('normalizes readonly list filters with valid accreditations as default', async () => {
        const source = createSourcePort();
        const store = createStorePort();
        const application = createMzcrAccreditationsApplication({
            mzcrAccreditationSourcePort: source,
            mzcrAccreditationStorePort: store
        });

        await application.listMzcrAccreditations({
            page: '2',
            limit: '500',
            organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            specialtyType: 'specialized_training',
            q: '  interna  ',
            actorUserId: 'user-1'
        });

        expect(store.listAccreditations).toHaveBeenCalledWith({
            page: 2,
            limit: 100,
            organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            validity: 'valid',
            specialtyType: 'specialized_training',
            q: 'interna',
            actorUserId: 'user-1'
        });
    });

    it('passes accreditation metadata lookup through to store', async () => {
        const source = createSourcePort();
        const store = createStorePort();
        const application = createMzcrAccreditationsApplication({
            mzcrAccreditationSourcePort: source,
            mzcrAccreditationStorePort: store
        });

        await application.getMzcrAccreditationMeta({ actorUserId: 'user-1' });

        expect(store.getAccreditationMeta).toHaveBeenCalledWith({ actorUserId: 'user-1' });
    });
});
