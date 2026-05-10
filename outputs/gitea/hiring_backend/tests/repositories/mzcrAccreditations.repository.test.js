const createMzcrAccreditationsStore = require('../../src/adapters/out/persistence/mzcrAccreditations');
const { createMockDb } = require('../helpers');

const createStateRow = () => ({
    last_started_sync_run_id: '11111111-1111-4111-8111-111111111111',
    last_successful_sync_run_id: '11111111-1111-4111-8111-111111111111',
    last_attempted_sync_at: new Date('2026-01-01T10:05:00Z'),
    last_successful_sync_at: new Date('2026-01-01T10:05:00Z'),
    last_status: 'success',
    last_error_message: null,
    catalogs_count: 1,
    accreditations_count: 1,
    stale_accreditations_count: 0,
    updated_at: new Date('2026-01-01T10:05:00Z')
});

describe('MZCR accreditations persistence adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('commits sync data transactionally and replaces relation rows for seen accreditations', async () => {
        const db = createMockDb();
        db._mockClient.query.mockImplementation(async (sql) => {
            if (String(sql).includes('RETURNING *')) {
                return { rows: [createStateRow()], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
        });
        const store = createMzcrAccreditationsStore({ db });

        const result = await store.commitSuccessfulSync({
            runId: '11111111-1111-4111-8111-111111111111',
            syncedAt: new Date('2026-01-01T10:05:00Z'),
            catalogs: {
                workplaceTypes: [{ id_pracoviste_typ: 3, name: 'II. typ' }],
                basicTrunks: [],
                basicFields: [],
                specializedTrainings: [],
                dentalSpecializations: [],
                certifiedCourses: [],
                extensionFields: []
            },
            accreditations: [{
                id_akreditace: 100,
                pracoviste_id: 24871,
                organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                vycvik_id: 3,
                sourceCategoryCodes: ['specializedTrainings'],
                pracovisteTypy: [{ id_pracoviste_typ: 3, name: 'II. typ' }],
                teorieZakladniKmenyKurzy: [{ id: 5, name: 'Kurz teorie' }],
                teorieVycvikyKurzy: []
            }],
            summary: {
                catalogsCount: 1,
                accreditationsCount: 1
            }
        });

        const sqlText = db._mockClient.query.mock.calls.map(([sql]) => String(sql)).join('\n');
        expect(db._mockClient.query.mock.calls[0][0]).toBe('BEGIN');
        expect(db._mockClient.query.mock.calls.at(-2)[0]).toContain('RETURNING *');
        expect(db._mockClient.query.mock.calls.at(-1)[0]).toBe('COMMIT');
        expect(sqlText).toContain('DELETE FROM mzcr_accreditation_source_categories');
        expect(sqlText).toContain('INSERT INTO mzcr_accreditation_workplace_type_assignments');
        expect(sqlText).toContain('INSERT INTO mzcr_accreditation_theory_basic_trunk_course_assignments');
        expect(sqlText).toContain('last_successful_sync_at');
        expect(sqlText).toContain('source_hash');
        expect(sqlText).toContain('raw');
        expect(sqlText).toContain('IS DISTINCT FROM EXCLUDED.source_hash');
        expect(sqlText).not.toContain('raw_payload');
        expect(sqlText).not.toContain('mzcr_accreditation_providers');
        expect(sqlText).not.toContain('mzcr_accreditation_workplaces');
        expect(sqlText).not.toContain('provider_id');
        expect(sqlText).not.toContain('workplace_id');

        const accreditationInsert = db._mockClient.query.mock.calls
            .find(([sql]) => String(sql).includes('INSERT INTO mzcr_accreditations'));
        expect(accreditationInsert[1][1]).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
        expect(accreditationInsert[1][23]).toMatch(/^[a-f0-9]{64}$/);
        expect(accreditationInsert[1][24]).toEqual(expect.objectContaining({
            id_akreditace: 100,
            pracoviste_id: 24871,
            vycvik_id: 3
        }));
        expect(accreditationInsert[1][24]).not.toHaveProperty('organization_id');
        expect(accreditationInsert[1][24]).not.toHaveProperty('sourceCategoryCodes');
        expect(result.status).toBe('success');
        expect(result.summary).toEqual(expect.objectContaining({
            accreditationsCount: 1,
            staleAccreditationsCount: 0
        }));
    });

    it('finds organizations by seat location for transient sync mapping', async () => {
        const db = createMockDb();
        db.query.mockResolvedValue({
            rows: [{
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                seat_location: 'UL'
            }]
        });
        const store = createMzcrAccreditationsStore({ db });

        await expect(store.findOrganizationsBySeatLocations({
            seatLocations: ['UL', 'UL']
        })).resolves.toEqual([{
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            seatLocation: 'UL'
        }]);

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM organizations'), [['UL']]);
    });

    it('lists readonly accreditations with default valid filtering and ReBAC organization access', async () => {
        const db = createMockDb();
        db.query
            .mockResolvedValueOnce({
                rows: [{
                    id_akreditace: 100,
                    organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    specialty_type: 'specialized_training',
                    specialty_type_label_cs: 'Specializační výcvik',
                    specialty_name: 'Vnitřní lékařství',
                    is_currently_valid: true
                }]
            })
            .mockResolvedValueOnce({ rows: [{ total: '1' }] });
        const store = createMzcrAccreditationsStore({ db });

        const result = await store.listAccreditations({
            page: 0,
            limit: 25,
            organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            validity: 'valid',
            specialtyType: 'specialized_training',
            q: 'vnitřní',
            actorUserId: 'user-1'
        });

        const [query, params] = db.query.mock.calls[0];
        expect(String(query)).toContain('FROM mzcr_accreditations_view accreditation');
        expect(String(query)).toContain('resource_permissions');
        expect(String(query)).toContain('accreditation.organization_id IS NOT NULL');
        expect(String(query)).toContain('accreditation.is_currently_valid = TRUE');
        expect(String(query)).toContain('accreditation.organization_id = $');
        expect(String(query)).toContain('accreditation.specialty_type = $');
        expect(String(query)).toContain('accreditation.specialty_name ILIKE $');
        expect(params).toEqual(expect.arrayContaining([
            'user-1',
            'organization',
            'read',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'specialized_training',
            '%vnitřní%',
            25,
            0
        ]));
        expect(result.pagination).toEqual(expect.objectContaining({
            page: 0,
            limit: 25,
            total: 1
        }));
    });

    it('returns accreditation specialty metadata scoped by organization access', async () => {
        const db = createMockDb();
        db.query.mockResolvedValue({
            rows: [{
                value: 'basic_trunk',
                label: 'Základní kmen'
            }]
        });
        const store = createMzcrAccreditationsStore({ db });

        await expect(store.getAccreditationMeta({ actorUserId: 'user-1' })).resolves.toEqual({
            specialtyTypes: [{
                value: 'basic_trunk',
                label: 'Základní kmen'
            }]
        });

        const [query, params] = db.query.mock.calls[0];
        expect(String(query)).toContain('FROM mzcr_accreditations_view accreditation');
        expect(String(query)).toContain('resource_permissions');
        expect(params).toEqual(['user-1', 'organization', 'read']);
    });

    it('marks failed runs without moving last successful sync timestamp', async () => {
        const db = createMockDb();
        db._mockClient.query.mockImplementation(async (sql) => {
            if (String(sql).includes('RETURNING id')) {
                return { rows: [{ id: '11111111-1111-4111-8111-111111111111' }], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
        });
        const store = createMzcrAccreditationsStore({ db });

        await store.failSyncRun({
            runId: '11111111-1111-4111-8111-111111111111',
            failedAt: new Date('2026-01-01T10:02:00Z'),
            errorMessage: 'source down'
        });

        const sqlText = db._mockClient.query.mock.calls.map(([sql]) => String(sql)).join('\n');
        expect(sqlText).toContain("last_status = 'failed'");
        expect(sqlText).not.toContain('last_successful_sync_at');
        expect(db._mockClient.query.mock.calls.at(-1)[0]).toBe('COMMIT');
    });
});
