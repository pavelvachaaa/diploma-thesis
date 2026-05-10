const createJobSeekerCvAnalysisRepository = require('../../src/adapters/out/persistence/jobSeekerCvAnalysis');

describe('jobSeekerCvAnalysis repository ReBAC SQL regressions', () => {
    let db;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
    });

    it('uses the analysis parent row for ACL checks in getByJobSeekerId', async () => {
        const repository = createJobSeekerCvAnalysisRepository({ db });

        await repository.getByJobSeekerId(
            '11111111-1111-4111-8111-111111111111',
            {
                actorUserId: '22222222-2222-4222-8222-222222222222',
                minAccess: 'read'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('FROM job_seeker_cv_analyses jca');
        expect(sql).toContain('jsl_scope.job_seeker_id = jca.job_seeker_id');
        expect(sql).not.toContain('jsl_scope.job_seeker_id = js.id');
        expect(params).toEqual([
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
            'organization',
            'read'
        ]);
    });

    it('uses the analysis parent row for ACL checks in getStatusByJobSeekerId', async () => {
        const repository = createJobSeekerCvAnalysisRepository({ db });

        await repository.getStatusByJobSeekerId(
            '33333333-3333-4333-8333-333333333333',
            {
                actorUserId: '44444444-4444-4444-8444-444444444444',
                minAccess: 'read'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('FROM job_seeker_cv_analyses jca');
        expect(sql).toContain('jsl_scope.job_seeker_id = jca.job_seeker_id');
        expect(sql).not.toContain('jsl_scope.job_seeker_id = js.id');
        expect(params).toEqual([
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
            'organization',
            'read'
        ]);
    });
});
