const createEmailRepository = require('../../src/adapters/out/persistence/email');

describe('email templates repository ReBAC SQL regressions', () => {
    let db;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
    });

    it('updates email templates with correlated organization ACL predicate', async () => {
        const repository = createEmailRepository({ db });

        await repository.update(
            '11111111-1111-4111-8111-111111111111',
            {
                name: 'Template',
                type: 'welcome',
                subject: 'Hello',
                body: '<p>Hello</p>'
            },
            {
                actorUserId: '22222222-2222-4222-8222-222222222222',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE email_templates et');
        expect(sql).toContain('WHERE o.id = et.organization_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE o.id = et.organization_id\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
            'organization',
            'write'
        ]));
    });

    it('deletes email templates with correlated organization ACL predicate', async () => {
        const repository = createEmailRepository({ db });

        await repository.remove(
            '33333333-3333-4333-8333-333333333333',
            {
                actorUserId: '44444444-4444-4444-8444-444444444444',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('DELETE FROM email_templates et');
        expect(sql).toContain('WHERE o.id = et.organization_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE o.id = et.organization_id\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
            'organization',
            'write'
        ]));
    });
});
