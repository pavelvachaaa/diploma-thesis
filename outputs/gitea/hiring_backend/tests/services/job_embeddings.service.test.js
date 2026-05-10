const createGetOrRequestJobEmbedding = require('../../src/core/jobs/application/getOrRequestJobEmbedding');
const { createMockLogger } = require('../helpers');

const buildMocks = () => {
    let txCallback = null;
    const txClient = { query: jest.fn() };

    return {
        logger: createMockLogger(),
        jobsStorePort: {
            withTransaction: jest.fn(async (callback) => {
                txCallback = callback;
                return callback(txClient);
            }),
            _txClient: txClient
        },
        jobEmbeddingsStorePort: {
            generateContentHash: jest.fn().mockReturnValue('hash-1'),
            getValidCachedEmbedding: jest.fn().mockResolvedValue(null),
            getByJobId: jest.fn().mockResolvedValue(null),
            createOrUpdatePending: jest.fn().mockResolvedValue({})
        },
        jobsOutboxPort: {
            enqueueJobEmbeddingRequest: jest.fn().mockResolvedValue({ id: 'outbox-1' })
        }
    };
};

describe('getOrRequestJobEmbedding use case', () => {
    let mocks;
    let getOrRequestEmbedding;

    beforeEach(() => {
        mocks = buildMocks();
        getOrRequestEmbedding = createGetOrRequestJobEmbedding(mocks);
    });

    it('returns cached embedding when available', async () => {
        mocks.jobEmbeddingsStorePort.getValidCachedEmbedding.mockResolvedValue({
            embedding: [0.1, 0.2]
        });

        const result = await getOrRequestEmbedding({ id: 'job-1' });

        expect(result).toEqual({ status: 'completed', embedding: [0.1, 0.2], cached: true });
        expect(mocks.jobEmbeddingsStorePort.createOrUpdatePending).not.toHaveBeenCalled();
        expect(mocks.jobsOutboxPort.enqueueJobEmbeddingRequest).not.toHaveBeenCalled();
    });

    it('creates pending record and enqueues outbox request in one transaction', async () => {
        const job = { id: 'job-1', organization_id: 'org-1', title: 'Nurse', description: 'desc' };

        const result = await getOrRequestEmbedding(job);

        expect(mocks.jobsStorePort.withTransaction).toHaveBeenCalledTimes(1);
        expect(mocks.jobEmbeddingsStorePort.createOrUpdatePending).toHaveBeenCalledWith(
            { job_id: 'job-1', content_hash: 'hash-1' },
            { client: mocks.jobsStorePort._txClient }
        );
        expect(mocks.jobsOutboxPort.enqueueJobEmbeddingRequest).toHaveBeenCalledWith(
            { job, contentHash: 'hash-1', organizationId: 'org-1' },
            { client: mocks.jobsStorePort._txClient }
        );
        expect(result).toEqual({ status: 'pending', message: 'Embedding generation has been queued' });
    });

    it('does not start new request when embedding already in progress', async () => {
        mocks.jobEmbeddingsStorePort.getByJobId.mockResolvedValue({ status: 'pending' });

        const result = await getOrRequestEmbedding({ id: 'job-1' });

        expect(result.status).toBe('pending');
        expect(result.message).toContain('in progress');
        expect(mocks.jobsStorePort.withTransaction).not.toHaveBeenCalled();
    });
});
