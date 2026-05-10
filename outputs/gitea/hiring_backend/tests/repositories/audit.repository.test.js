const { createMockDb } = require('../helpers');
const createRepository = require('../../src/adapters/out/persistence/operations/auditStore');

describe('audit repository', () => {
    it('builds employee-scoped query as actor-or-resource(employee)', async () => {
        const db = createMockDb();
        const repository = createRepository({ db });

        db.query
            .mockResolvedValueOnce({ rows: [{ total: 1 }] })
            .mockResolvedValueOnce({ rows: [{ id: 'audit-1' }] });

        const result = await repository.getEmployeeEvents({
            employeeId: 'employee-1',
            page: 1,
            limit: 10,
            status: 'success'
        });

        expect(db.query).toHaveBeenCalledTimes(2);
        expect(db.query.mock.calls[0][0]).toContain('(actor_user_id = $2 OR (resource_type = \'employee\' AND resource_id = $3))');
        expect(db.query.mock.calls[0][0]).toContain('status = $1');
        expect(db.query.mock.calls[0][1]).toEqual(['success', 'employee-1', 'employee-1']);
        expect(db.query.mock.calls[1][0]).toContain('ORDER BY occurred_at DESC');
        expect(db.query.mock.calls[1][1]).toEqual(['success', 'employee-1', 'employee-1', 10, 10]);
        expect(result).toEqual({
            data: [{ id: 'audit-1' }],
            page: 1,
            limit: 10,
            total: 1
        });
    });
});
