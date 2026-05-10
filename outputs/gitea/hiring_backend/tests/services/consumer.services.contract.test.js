const createCvAnalysisConsumerService = require('../../src/adapters/in/worker/cvAnalysis/consumer');
const createJobSeekerCvConsumerService = require('../../src/adapters/in/worker/jobSeekerCvAnalysis/consumer');
const createJobEmbeddingsConsumerService = require('../../src/adapters/in/worker/jobs/embeddingConsumer');
const { createMockDb, createMockLogger } = require('../helpers');

describe('consumer services API contracts', () => {
    it('cvAnalysisConsumerService exposes expected methods', () => {
        const service = createCvAnalysisConsumerService({
            cvAnalysisResultApplication: {
                saveAnalysis: jest.fn(),
                saveFailure: jest.fn()
            },
            logger: createMockLogger()
        });

        expect(Object.keys(service).sort()).toEqual([
            'saveAnalysis',
            'saveFailure',
            'start',
            'stop'
        ]);
    });

    it('jobSeekerCvConsumerService exposes expected methods', () => {
        const service = createJobSeekerCvConsumerService({
            jobSeekerCvAnalysisResultApplication: {
                saveAnalysis: jest.fn(),
                saveFailure: jest.fn()
            },
            logger: createMockLogger()
        });

        expect(Object.keys(service).sort()).toEqual([
            'saveAnalysis',
            'saveFailure',
            'start',
            'stop'
        ]);
    });

    it('jobEmbeddingsConsumerService exposes expected methods', () => {
        const service = createJobEmbeddingsConsumerService({
            jobEmbeddingsStorePort: {
                saveFailedResult: jest.fn(),
                saveCompletedResult: jest.fn()
            },
            logger: createMockLogger()
        });

        expect(Object.keys(service).sort()).toEqual([
            'saveResult',
            'start',
            'stop'
        ]);
    });
});
