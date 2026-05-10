const createCvAnalysisService = require('../../src/core/cvAnalysis/application');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    cvAnalysisStorePort: {},
    cvAnalysisUnitOfWorkPort: {},
    cvIntentPort: {},
    logger: createMockLogger()
});

describe('cvAnalysis.service API contract', () => {
    it('exposes expected cvAnalysis service API surface', () => {
        const service = createCvAnalysisService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'createPendingAnalysis',
            'getAnalysis',
            'getAnalysisByAttachment',
            'getStats',
            'getStatus',
            'searchBySkills',
            'triggerReanalysis'
        ]);
    });
});
