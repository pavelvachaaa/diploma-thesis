const { createConsumerRunner } = require('@platform/rabbitmq/consumerRunner');

module.exports = ({ jobEmbeddingsStorePort, logger }) => {
    const queue = 'job_embedding_results';
    const exchange = 'cv_events';
    const routingKey = 'job.embedding.completed';

    const saveResult = async (result) => {
        if (result.status === 'failed') {
            await jobEmbeddingsStorePort.saveFailedResult(result);
            logger.warn('Job embedding failed', { job_id: result.job_id, error_message: result.error_message });
            return;
        }
        await jobEmbeddingsStorePort.saveCompletedResult(result);
    };

    const runner = createConsumerRunner({
        logger,
        consumer: 'job-embedding-results',
        exchange,
        queue,
        routingKey,
        queueOptions: { durable: true, arguments: { 'x-message-ttl': 86400000 } },
        handleMessage: async ({ payload }) => {
            await saveResult(payload);
            logger.info('Job embedding result saved', { job_id: payload.job_id, status: payload.status });
        }
    });

    return { start: () => runner.start(), saveResult, stop: () => runner.stop() };
};
