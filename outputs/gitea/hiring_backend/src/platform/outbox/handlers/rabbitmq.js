const {
    buildNormalizedTypeSet,
    createOutboxStrategy
} = require('./shared');

module.exports = ({ rabbitmqService, eventTypes }) => {
    const dispatchApplicantCvPublish = async (event) => {
        const published = await rabbitmqService.publishCVEventConfirmed(event.payload || {});

        if (!published) {
            const error = new Error('RabbitMQ confirm publish failed for cv.uploaded');
            error.code = 'RABBITMQ_CV_PUBLISH_FAILED';
            error.isPermanent = false;
            throw error;
        }

        return {
            brokerRoutingKey: 'cv.uploaded'
        };
    };

    const dispatchJobSeekerCvPublish = async (event) => {
        const published = await rabbitmqService.publishJobSeekerCVEventConfirmed(event.payload || {});

        if (!published) {
            const error = new Error('RabbitMQ confirm publish failed for job_seeker_cv.uploaded');
            error.code = 'RABBITMQ_JOB_SEEKER_CV_PUBLISH_FAILED';
            error.isPermanent = false;
            throw error;
        }

        return {
            brokerRoutingKey: 'job_seeker_cv.uploaded'
        };
    };

    const dispatchJobEmbeddingRequested = async (event) => {
        const published = await rabbitmqService.publishJobEmbeddingRequestConfirmed(event.payload || {});

        if (!published) {
            const error = new Error('RabbitMQ confirm publish failed for job.embedding.requested');
            error.code = 'RABBITMQ_JOB_EMBEDDING_PUBLISH_FAILED';
            error.isPermanent = false;
            throw error;
        }

        return {
            brokerRoutingKey: 'job.embedding.requested'
        };
    };

    return [
        createOutboxStrategy({
            key: 'cvApplicant',
            eventTypes: buildNormalizedTypeSet(eventTypes?.CV_PUBLISH_APPLICANT, [
                'cv.publish.applicant.v1',
                'cv.uploaded'
            ]),
            prefixes: ['cv.publish.applicant'],
            dispatch: dispatchApplicantCvPublish
        }),
        createOutboxStrategy({
            key: 'cvJobSeeker',
            eventTypes: buildNormalizedTypeSet(eventTypes?.CV_PUBLISH_JOB_SEEKER, [
                'cv.publish.job_seeker.v1',
                'job_seeker_cv.uploaded'
            ]),
            prefixes: ['cv.publish.job_seeker'],
            dispatch: dispatchJobSeekerCvPublish
        }),
        createOutboxStrategy({
            key: 'jobEmbedding',
            eventTypes: buildNormalizedTypeSet(eventTypes?.JOB_EMBEDDING_REQUESTED, [
                'job.embedding.requested.v1',
                'job.embedding.requested'
            ]),
            prefixes: ['job.embedding.requested'],
            dispatch: dispatchJobEmbeddingRequested
        })
    ];
};
