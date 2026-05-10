const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/cvAnalysis/cvAnalysisStore.proxy');

describe('CvAnalysisStorePort runtime proxy', () => {
    it('delegates store operations through the strict port', async () => {
        const cvAnalysisStoreAdapter = {
            getByApplicantId: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
            getByAttachmentId: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
            searchBySkills: jest.fn().mockResolvedValue([{ id: 'analysis-1' }]),
            getStats: jest.fn().mockResolvedValue({ total_analyzed: '1' }),
            getApplicantAttachmentInfo: jest.fn().mockResolvedValue({ attachment_id: 'att-1' }),
            createOrUpdatePending: jest.fn().mockResolvedValue({ id: 'pending-1' }),
            getStatusByApplicantId: jest.fn().mockResolvedValue({ status: 'pending' }),
            saveAnalysisResult: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
            saveAnalysisFailure: jest.fn().mockResolvedValue({ id: 'analysis-1' })
        };
        const port = createProxy({ cvAnalysisStoreAdapter });

        await port.getByApplicantId('app-1', { actorUserId: 'user-1' });
        await port.getByAttachmentId('att-1');
        await port.searchBySkills(['SQL'], { limit: 10 });
        await port.getStats();
        await port.getApplicantAttachmentInfo('app-1');
        await port.createOrUpdatePending({ attachment_id: 'att-1', applicant_id: 'app-1' });
        await port.getStatusByApplicantId('app-1');
        await port.saveAnalysisResult({ attachment_id: 'att-1', applicant_id: 'app-1' });
        await port.saveAnalysisFailure({ attachment_id: 'att-1', applicant_id: 'app-1' });

        expect(cvAnalysisStoreAdapter.getByApplicantId).toHaveBeenCalledWith('app-1', { actorUserId: 'user-1' });
        expect(cvAnalysisStoreAdapter.searchBySkills).toHaveBeenCalledWith(['SQL'], { limit: 10 });
        expect(cvAnalysisStoreAdapter.saveAnalysisFailure).toHaveBeenCalledWith(
            { attachment_id: 'att-1', applicant_id: 'app-1' },
            {}
        );
    });
});
