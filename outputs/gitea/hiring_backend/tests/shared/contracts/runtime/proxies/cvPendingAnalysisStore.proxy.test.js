const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/cv/cvPendingAnalysisStore.proxy');

describe('CvPendingAnalysisStorePort runtime proxy', () => {
    it('delegates pending analysis writes', async () => {
        const cvPendingAnalysisStoreAdapter = {
            createApplicantPendingAnalysis: jest.fn().mockResolvedValue({ id: 'pending-1' }),
            createJobSeekerPendingAnalysis: jest.fn().mockResolvedValue({ id: 'pending-2' })
        };
        const port = createProxy({ cvPendingAnalysisStoreAdapter });
        const options = { client: { query: jest.fn() } };

        await port.createApplicantPendingAnalysis({ attachmentId: 'att-1', applicantId: 'app-1' }, options);
        await port.createJobSeekerPendingAnalysis({ jobSeekerId: 'js-1' }, options);

        expect(cvPendingAnalysisStoreAdapter.createApplicantPendingAnalysis).toHaveBeenCalledWith(
            { attachmentId: 'att-1', applicantId: 'app-1' },
            { client: expect.any(Object) }
        );
        expect(cvPendingAnalysisStoreAdapter.createJobSeekerPendingAnalysis).toHaveBeenCalledWith(
            { jobSeekerId: 'js-1' },
            { client: expect.any(Object) }
        );
    });
});
