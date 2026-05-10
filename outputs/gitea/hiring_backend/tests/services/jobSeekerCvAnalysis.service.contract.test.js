const createJobSeekerCvAnalysisService = require('../../src/core/jobSeekerCvAnalysis/application');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    jobSeekerCvAnalysisStorePort: {},
    jobSeekerCvAnalysisUnitOfWorkPort: {},
    cvIntentPort: {},
    logger: createMockLogger()
});

describe('jobSeekerCvAnalysis.service API contract', () => {
    it('exposes expected jobSeekerCvAnalysis service API surface', () => {
        const service = createJobSeekerCvAnalysisService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'createPendingAnalysis',
            'findMatchingJobSeekers',
            'getAnalysis',
            'getStats',
            'getStatus',
            'searchBySkills',
            'triggerAnalysis',
            'triggerReanalysis'
        ]);
    });
});
