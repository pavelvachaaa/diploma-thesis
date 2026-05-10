const createOnboardingDocumentsRepository = require('../../src/domain/onboardingDocuments/repository');

describe('onboarding documents repository ReBAC SQL regressions', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
        repository = createOnboardingDocumentsRepository({ db });
    });

    it('updates job role document assignments with a correlated organization ACL subquery', async () => {
        await repository.updateJobRoleAssignment(
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
            true,
            {
                actorUserId: '33333333-3333-4333-8333-333333333333',
                minAccess: 'write'
            }
        );

        const [sql] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE job_role_required_documents jrrd');
        expect(sql).toContain('WHERE jr.id = jrrd.job_role_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('jrrd.job_role_id\n                    EXISTS');
    });

    it('removes workflow document assignments with a correlated organization ACL subquery', async () => {
        await repository.removeDocumentFromWorkflow(
            '44444444-4444-4444-8444-444444444444',
            '55555555-5555-4555-8555-555555555555',
            {
                actorUserId: '66666666-6666-4666-8666-666666666666',
                minAccess: 'write'
            }
        );

        const [sql] = db.query.mock.calls[0];
        expect(sql).toContain('DELETE FROM workflow_documents wd');
        expect(sql).toContain('WHERE ow.id = wd.workflow_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('wd.workflow_id\n                    EXISTS');
    });
});
