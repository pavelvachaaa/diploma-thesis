const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekerCvAnalysis/jobSeekerCvAnalysisUnitOfWork.proxy');

describe('JobSeekerCvAnalysisUnitOfWorkPort runtime proxy', () => {
    it('delegates transaction callbacks through the strict port', async () => {
        const jobSeekerCvAnalysisUnitOfWorkAdapter = {
            runInTransaction: jest.fn(async (work, options) => work({ options }))
        };
        const port = createProxy({ jobSeekerCvAnalysisUnitOfWorkAdapter });
        const work = jest.fn(async () => 'ok');

        await expect(port.runInTransaction(work, { label: 'jobSeekerCvAnalysis.test' })).resolves.toBe('ok');

        expect(jobSeekerCvAnalysisUnitOfWorkAdapter.runInTransaction).toHaveBeenCalledWith(work, {
            label: 'jobSeekerCvAnalysis.test'
        });
    });
});
