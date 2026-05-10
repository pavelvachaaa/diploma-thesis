const createOrganizationsRepository = require('../../src/adapters/out/persistence/organizations');

describe('organizations repository ReBAC SQL regressions', () => {
    let db;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
    });

    it('keeps the target organization id parameter stable when ACL params are appended', async () => {
        const repository = createOrganizationsRepository({ db });

        await repository.update(
            '11111111-1111-4111-8111-111111111111',
            {
                name: 'Updated org',
                contact_email: 'updated@example.com'
            },
            {
                actorUserId: '22222222-2222-4222-8222-222222222222',
                minAccess: 'admin'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE organizations o');
        expect(sql).toContain('name = $1');
        expect(sql).toContain('contact_email = $2');
        expect(sql).toContain('WHERE o.id = $3');
        expect(sql).toContain('AND EXISTS (');
        expect(params).toEqual([
            'Updated org',
            'updated@example.com',
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
            'organization',
            'admin'
        ]);
    });
});
