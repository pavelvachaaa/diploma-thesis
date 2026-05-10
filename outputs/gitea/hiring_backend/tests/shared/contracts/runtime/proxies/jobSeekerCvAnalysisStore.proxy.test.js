const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekerCvAnalysis/jobSeekerCvAnalysisStore.proxy');

describe('JobSeekerCvAnalysisStorePort runtime proxy', () => {
    it('delegates store operations through the strict port', async () => {
        const jobSeekerCvAnalysisStoreAdapter = {
            getByJobSeekerId: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
            getStatusByJobSeekerId: jest.fn().mockResolvedValue({ status: 'pending' }),
            createOrUpdatePending: jest.fn().mockResolvedValue({ id: 'pending-1' }),
            searchBySkills: jest.fn().mockResolvedValue([{ id: 'analysis-1' }]),
            findMatchingByEmbedding: jest.fn().mockResolvedValue([{ id: 'js-1' }]),
            getStats: jest.fn().mockResolvedValue({ total_analyzed: '1' }),
            saveAnalysisResult: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
            saveAnalysisFailure: jest.fn().mockResolvedValue({ id: 'analysis-1' })
        };
        const port = createProxy({ jobSeekerCvAnalysisStoreAdapter });

        await port.getByJobSeekerId('js-1', { actorUserId: 'user-1' });
        await port.getStatusByJobSeekerId('js-1');
        await port.createOrUpdatePending({ job_seeker_id: 'js-1' });
        await port.searchBySkills(['SQL'], { limit: 10 });
        await port.findMatchingByEmbedding([0.1, 0.2], { threshold: 0.5 });
        await port.getStats();
        await port.saveAnalysisResult({ job_seeker_id: 'js-1' });
        await port.saveAnalysisFailure({ job_seeker_id: 'js-1' });

        expect(jobSeekerCvAnalysisStoreAdapter.getByJobSeekerId).toHaveBeenCalledWith('js-1', { actorUserId: 'user-1' });
        expect(jobSeekerCvAnalysisStoreAdapter.findMatchingByEmbedding).toHaveBeenCalledWith([0.1, 0.2], { threshold: 0.5 });
        expect(jobSeekerCvAnalysisStoreAdapter.saveAnalysisFailure).toHaveBeenCalledWith({ job_seeker_id: 'js-1' }, {});
    });
});
