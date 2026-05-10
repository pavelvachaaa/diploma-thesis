const { createConsumerRunner } = require('@platform/rabbitmq/consumerRunner');

module.exports = ({ jobSeekerCvAnalysisResultApplication, logger }) => {
    const queue = 'job_seeker_cv_results';
    const exchange = 'cv_events';
    const routingKey = 'job_seeker_cv.analyzed';

    const runner = createConsumerRunner({
        logger,
        consumer: 'job-seeker-cv-analysis-results',
        exchange,
        queue,
        routingKey,
        queueOptions: {
            durable: true,
            arguments: {
                'x-message-ttl': 86400000
            }
        },
        handleMessage: async ({ payload }) => {
            await saveAnalysis(payload);

            logger.info('Job seeker CV analysis saved', {
                job_seeker_id: payload.job_seeker_id,
                status: payload.status || 'completed'
            });
        }
    });

    const saveAnalysis = (result) => jobSeekerCvAnalysisResultApplication.saveAnalysis(result);

    const saveFailure = async (result) => {
        const saved = await jobSeekerCvAnalysisResultApplication.saveFailure(result);

        logger.warn('Job seeker CV analysis failed', {
            job_seeker_id: result.job_seeker_id,
            error_message: result.error_message
        });

        return saved;
    };

    const start = async () => runner.start();
    const stop = async () => runner.stop();

    return { start, saveAnalysis, saveFailure, stop };
};
