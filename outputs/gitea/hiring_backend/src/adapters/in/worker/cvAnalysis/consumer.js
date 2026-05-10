const { createConsumerRunner } = require('@platform/rabbitmq/consumerRunner');

module.exports = ({ cvAnalysisResultApplication, logger }) => {
    const queue = 'cv_results';
    const exchange = 'cv_events';
    const routingKey = 'cv.analyzed';

    const runner = createConsumerRunner({
        logger,
        consumer: 'cv-analysis-results',
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

            logger.info('CV analysis saved', {
                attachment_id: payload.attachment_id,
                applicant_id: payload.applicant_id,
                score: payload.evaluation_score
            });
        }
    });

    const saveAnalysis = (result) => cvAnalysisResultApplication.saveAnalysis(result);

    const saveFailure = async (result) => {
        const saved = await cvAnalysisResultApplication.saveFailure(result);

        logger.warn('CV analysis failed', {
            attachment_id: result.attachment_id,
            applicant_id: result.applicant_id,
            error_message: result.error_message
        });

        return saved;
    };

    const start = async () => runner.start();
    const stop = async () => runner.stop();

    return { start, saveAnalysis, saveFailure, stop };
};
