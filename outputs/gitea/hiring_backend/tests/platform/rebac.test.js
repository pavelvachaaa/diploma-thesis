const createRebacService = require('../../src/platform/rebac');
const { createMockLogger } = require('../helpers');

describe('rebac platform SQL regressions', () => {
    let service;
    let client;

    beforeEach(() => {
        client = {
            query: jest.fn()
        };

        service = createRebacService({
            db: {
                query: jest.fn(),
                getClient: jest.fn()
            },
            logger: createMockLogger(),
            transactionManager: {}
        });
    });

    it('casts job posting id to uuid when syncing job posting permissions', async () => {
        client.query
            .mockResolvedValueOnce({
                rows: [{
                    id: '11111111-1111-4111-8111-111111111111',
                    organization_id: '22222222-2222-4222-8222-222222222222'
                }]
            })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await service.syncJobPostingPermissions('11111111-1111-4111-8111-111111111111', { client });

        const [sql, params] = client.query.mock.calls[2];
        expect(sql).toContain("'job_posting'");
        expect(sql).toContain('$2::uuid');
        expect(params).toEqual([
            '22222222-2222-4222-8222-222222222222',
            '11111111-1111-4111-8111-111111111111',
            'membership:',
            'user_role:'
        ]);
    });

    it('casts organization id to uuid when syncing organization permissions', async () => {
        client.query
            .mockResolvedValueOnce({
                rows: [{
                    id: '33333333-3333-4333-8333-333333333333'
                }]
            })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await service.syncOrganizationPermissions('33333333-3333-4333-8333-333333333333', { client });

        const [sql, params] = client.query.mock.calls[2];
        expect(sql).toContain("'organization'");
        expect(sql).toContain('$2::uuid');
        expect(params).toEqual([
            '33333333-3333-4333-8333-333333333333',
            '33333333-3333-4333-8333-333333333333',
            'membership:',
            'user_role:'
        ]);
    });

    it('casts direct assignment resource ids to uuid', async () => {
        client.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await service.replaceDirectJobAssignments(
            '44444444-4444-4444-8444-444444444444',
            ['55555555-5555-4555-8555-555555555555'],
            { client }
        );

        const [sql, params] = client.query.mock.calls[1];
        expect(sql).toContain('$1::uuid');
        expect(params).toEqual([
            '44444444-4444-4444-8444-444444444444',
            'direct_job_assignment',
            ['55555555-5555-4555-8555-555555555555']
        ]);
    });
});
