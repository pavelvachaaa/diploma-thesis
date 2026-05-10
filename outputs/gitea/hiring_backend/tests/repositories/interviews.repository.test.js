const createInterviewRepository = require('../../src/domain/interviews/repository');
const { createMockLogger } = require('../helpers');

describe('interviews repository decomposition regressions', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn()
        };
        repository = createInterviewRepository({ db, logger: createMockLogger() });
    });

    it('builds update query through updates slice with interview ACL predicate', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id: 'int-1' }] });

        await repository.update('int-1', { title: 'Updated' }, {
            actorUserId: 'user-1',
            minAccess: 'write'
        });

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE interview_events ie');
        expect(sql).toContain('AND EXISTS (');
        expect(params).toEqual(expect.arrayContaining(['int-1', 'user-1', 'job_posting', 'write']));
    });
});
