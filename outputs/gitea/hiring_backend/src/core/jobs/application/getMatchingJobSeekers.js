module.exports = ({
    jobsStorePort,
    jobEmbeddingsStorePort,
    jobsOutboxPort,
    jobSeekerCvAnalysisQueryPort,
    logger
}) => {
    const getOrRequestEmbedding = require('./getOrRequestJobEmbedding')({ jobEmbeddingsStorePort, jobsStorePort, jobsOutboxPort, logger });

    return async (jobId, { limit = 20, threshold = 0.5 } = {}, organizationScope = null, actorUserId = null) => {
        const job = await jobsStorePort.getJobDetailAdmin(jobId, {
            actorUserId,
            minAccess: 'read'
        });
        if (!job) {
            return null;
        }

        const embeddingResult = await getOrRequestEmbedding(job);
        if (embeddingResult.status !== 'completed' || !embeddingResult.embedding) {
            return {
                job_id: jobId,
                job_title: job.title,
                status: embeddingResult.status,
                message: embeddingResult.message || 'Job embedding is being generated. Please try again shortly.',
                matches: [],
                isProcessing: true
            };
        }

        const matches = await jobSeekerCvAnalysisQueryPort.findMatchingJobSeekers(
            embeddingResult.embedding,
            {
                actorUserId,
                organizationId: organizationScope || job.organization_id,
                minAccess: 'read',
                limit: Math.min(parseInt(limit, 10) || 20, 50),
                threshold: parseFloat(threshold) || 0.5
            }
        );

        return {
            job_id: jobId,
            job_title: job.title,
            status: 'completed',
            cached: embeddingResult.cached || false,
            count: matches.length,
            matches,
            isProcessing: false
        };
    };
};
