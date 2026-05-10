const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekerCvAnalysis/jobSeekerCvAnalysisQuery.proxy');

describe('JobSeekerCvAnalysisQueryPort runtime proxy', () => {
    it('delegates matching queries through the strict port', async () => {
        const jobSeekerCvAnalysisService = {
            findMatchingJobSeekers: jest.fn().mockResolvedValue([{ id: 'js-1' }])
        };
        const port = createProxy({ jobSeekerCvAnalysisService });

        await port.findMatchingJobSeekers([0.1, 0.2], { limit: 10 });

        expect(jobSeekerCvAnalysisService.findMatchingJobSeekers).toHaveBeenCalledWith([0.1, 0.2], { limit: 10 });
    });
});
