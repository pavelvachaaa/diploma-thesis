const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/cvAnalysis/cvAnalysisUnitOfWork.proxy');

describe('CvAnalysisUnitOfWorkPort runtime proxy', () => {
    it('delegates transaction callbacks through the strict port', async () => {
        const cvAnalysisUnitOfWorkAdapter = {
            runInTransaction: jest.fn(async (work, options) => work({ options }))
        };
        const port = createProxy({ cvAnalysisUnitOfWorkAdapter });
        const work = jest.fn(async () => 'ok');

        await expect(port.runInTransaction(work, { label: 'cvAnalysis.test' })).resolves.toBe('ok');

        expect(cvAnalysisUnitOfWorkAdapter.runInTransaction).toHaveBeenCalledWith(work, { label: 'cvAnalysis.test' });
    });
});
