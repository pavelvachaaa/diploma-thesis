const createJobRoleSectionItemsStoreAdapter = require('../../src/adapters/out/persistence/sectionItems/jobRoleAssignments');
const createSectionItemsCatalogStoreAdapter = require('../../src/adapters/out/persistence/sectionItems/catalog');

describe('section items repository ReBAC SQL regressions', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
        repository = createJobRoleSectionItemsStoreAdapter({ db });
    });

    it('updates job role section items with a correlated organization ACL subquery', async () => {
        await repository.updateJobRoleItem(
            '11111111-1111-4111-8111-111111111111',
            {
                section_type_name: 'duties',
                section_item_id: '22222222-2222-4222-8222-222222222222',
                custom_text: null,
                order_index: 1
            },
            {
                actorUserId: '33333333-3333-4333-8333-333333333333',
                minAccess: 'write'
            }
        );

        const [sql] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE job_role_section_items');
        expect(sql).toContain('WHERE jrsi_scope.id = job_role_section_items.id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('job_role_section_items.id\n                    EXISTS');
    });

    it('deletes job role section items with a correlated organization ACL subquery', async () => {
        await repository.removeFromJobRole(
            '44444444-4444-4444-8444-444444444444',
            {
                actorUserId: '55555555-5555-4555-8555-555555555555',
                minAccess: 'write'
            }
        );

        const [sql] = db.query.mock.calls[0];
        expect(sql).toContain('DELETE FROM job_role_section_items');
        expect(sql).toContain('WHERE jrsi_scope.id = job_role_section_items.id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('job_role_section_items.id\n                    EXISTS');
    });

    it('throws not found when replacing job role section items without ACL access', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        await expect(repository.replaceJobRoleSectionItems(
            '11111111-1111-4111-8111-111111111111',
            'duties',
            [{ section_item_id: '22222222-2222-4222-8222-222222222222', custom_text: null }],
            {
                actorUserId: '33333333-3333-4333-8333-333333333333',
                minAccess: 'write'
            }
        )).rejects.toMatchObject({
            code: 'NOT_FOUND',
            message: 'Job role not found'
        });
    });

    it('bulk inserts replacement job role section items after deleting existing rows', async () => {
        await repository.replaceJobRoleSectionItems(
            '11111111-1111-4111-8111-111111111111',
            'duties',
            [
                { section_item_id: '22222222-2222-4222-8222-222222222222', custom_text: null },
                { section_item_id: null, custom_text: 'Custom text' }
            ]
        );

        expect(db.query).toHaveBeenCalledTimes(2);
        expect(db.query.mock.calls[0][0]).toContain('DELETE FROM job_role_section_items');
        expect(db.query.mock.calls[1][0]).toContain('INSERT INTO job_role_section_items');
        expect(db.query.mock.calls[1][0]).toContain('VALUES (gen_random_uuid(), $1, $2, $3, $4, $5), (gen_random_uuid(), $1, $2, $6, $7, $8)');
        expect(db.query.mock.calls[1][1]).toEqual([
            '11111111-1111-4111-8111-111111111111',
            'duties',
            '22222222-2222-4222-8222-222222222222',
            null,
            0,
            null,
            'Custom text',
            1
        ]);
    });
});

describe('section items catalog repository lookups', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [{ id: 'item-1' }] })
        };
        repository = createSectionItemsCatalogStoreAdapter({ db });
    });

    it('builds ranked section suggestions with section filter, search, and limit', async () => {
        const rows = await repository.getBySectionType('duties', {
            activeOnly: true,
            search: 'Péče',
            limit: 5
        });

        const [sql, params] = db.query.mock.calls[0];
        expect(rows).toEqual([{ id: 'item-1' }]);
        expect(sql).toContain('FROM section_items si');
        expect(sql).toContain('si.section_type_name = $1');
        expect(sql).toContain('si.is_active = true');
        expect(sql).toContain('LOWER(BTRIM(si.item_text)) LIKE $2');
        expect(sql).toContain('WHEN LOWER(BTRIM(si.item_text)) = $3 THEN 0');
        expect(sql).toContain('WHEN LOWER(BTRIM(si.item_text)) LIKE $4 THEN 1');
        expect(sql).toContain('LIMIT $5');
        expect(params).toEqual(['duties', '%péče%', 'péče', 'péče%', 5]);
    });

    it('keeps default ordering when no search term is provided', async () => {
        await repository.getBySectionType('requirements', { activeOnly: true });

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('ORDER BY si.order_index, si.item_text');
        expect(sql).not.toContain('CASE');
        expect(params).toEqual(['requirements']);
    });
});

describe('section items catalog repository ensureCatalogItems', () => {
    let db;
    let repository;
    let client;

    beforeEach(() => {
        db = {
            query: jest.fn()
        };
        client = {
            query: jest.fn()
        };
        repository = createSectionItemsCatalogStoreAdapter({ db });
    });

    it('returns early when there is nothing to ensure', async () => {
        const result = await repository.ensureCatalogItems('duties', ['  ', '', null], { client });

        expect(result).toEqual([]);
        expect(client.query).not.toHaveBeenCalled();
    });

    it('reactivates inactive matches and appends new catalog items without duplicates', async () => {
        client.query.mockImplementation(async (sql, params) => {
            if (sql.includes('LOWER(BTRIM(item_text)) = ANY')) {
                return {
                    rows: [{
                        id: 'item-existing',
                        section_type_name: 'duties',
                        item_text: 'Stávající text',
                        is_active: false,
                        created_at: '2026-01-01T00:00:00.000Z',
                        order_index: 4
                    }]
                };
            }

            if (sql.includes('SET is_active = true')) {
                return {
                    rows: [{
                        id: 'item-existing',
                        section_type_name: 'duties',
                        item_text: 'Stávající text',
                        is_active: true,
                        created_at: '2026-01-01T00:00:00.000Z',
                        order_index: 4
                    }]
                };
            }

            if (sql.includes('MAX(order_index)')) {
                return {
                    rows: [{
                        max_order_index: 7
                    }]
                };
            }

            if (sql.includes('INSERT INTO section_items')) {
                return {
                    rows: [{
                        id: 'item-new',
                        section_type_name: params[0],
                        item_text: params[1],
                        is_active: true,
                        order_index: params[2]
                    }]
                };
            }

            throw new Error(`Unexpected SQL in test: ${sql}`);
        });

        const result = await repository.ensureCatalogItems(
            'duties',
            [' Stávající text ', 'Nový text', 'nový text'],
            { client }
        );

        expect(result).toEqual([
            expect.objectContaining({
                id: 'item-existing',
                item_text: 'Stávající text',
                is_active: true,
                order_index: 4
            }),
            expect.objectContaining({
                id: 'item-new',
                item_text: 'Nový text',
                is_active: true,
                order_index: 8
            })
        ]);
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining('LOWER(BTRIM(item_text)) = ANY'),
            ['duties', ['stávající text', 'nový text']]
        );
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining('SET is_active = true'),
            ['item-existing']
        );
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO section_items'),
            ['duties', 'Nový text', 8]
        );
    });
});
