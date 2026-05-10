const createJobRolesRepository = require('../../src/adapters/out/persistence/catalog/jobRoles');

describe('job roles repository ReBAC SQL regressions', () => {
    let db;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
    });

    it('updates job roles with correlated source and target organization ACL predicates', async () => {
        const repository = createJobRolesRepository({ db });

        await repository.update(
            '11111111-1111-4111-8111-111111111111',
            {
                name: 'Updated role',
                description: 'Updated description',
                organization_id: '22222222-2222-4222-8222-222222222222',
                classification_code: 'nurse'
            },
            {
                actorUserId: '33333333-3333-4333-8333-333333333333',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE job_roles jr');
        expect(sql).toContain('WHERE o.id = jr.organization_id');
        expect(sql).toContain('WHERE o_target.id = $3');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE o.id = jr.organization_id\n                EXISTS');
        expect(sql).not.toContain('WHERE o_target.id = $3\n                    EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
            '33333333-3333-4333-8333-333333333333',
            'organization',
            'write'
        ]));
    });

    it('deletes job roles with correlated organization ACL predicate', async () => {
        const repository = createJobRolesRepository({ db });

        await repository.delete(
            '44444444-4444-4444-8444-444444444444',
            {
                actorUserId: '55555555-5555-4555-8555-555555555555',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('DELETE FROM job_roles');
        expect(sql).toContain('WHERE jr_scope.id = $1');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE jr_scope.id = $1\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '44444444-4444-4444-8444-444444444444',
            '55555555-5555-4555-8555-555555555555',
            'organization',
            'write'
        ]));
    });
});
