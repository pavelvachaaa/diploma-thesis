module.exports = ({ jobEmbeddingsStorePort, jobsStorePort, jobsOutboxPort, logger }) => async (job) => {
    const contentHash = jobEmbeddingsStorePort.generateContentHash(job);

    const cached = await jobEmbeddingsStorePort.getValidCachedEmbedding(job.id, contentHash);
    if (cached && cached.embedding) {
        logger.info('Using cached job embedding', { jobId: job.id, contentHash });
        return { status: 'completed', embedding: cached.embedding, cached: true };
    }

    const existing = await jobEmbeddingsStorePort.getByJobId(job.id);
    if (existing && (existing.status === 'pending' || existing.status === 'processing')) {
        logger.info('Job embedding already in progress', { jobId: job.id, status: existing.status });
        return { status: existing.status, message: 'Embedding generation is in progress' };
    }

    await jobsStorePort.withTransaction(async (client) => {
        await jobEmbeddingsStorePort.createOrUpdatePending({ job_id: job.id, content_hash: contentHash }, { client });
        await jobsOutboxPort.enqueueJobEmbeddingRequest(
            { job, contentHash, organizationId: job.organization_id || null },
            { client }
        );
    });

    logger.info('Job embedding request queued', { jobId: job.id, contentHash });

    return { status: 'pending', message: 'Embedding generation has been queued' };
};
