const createOnboardingDocumentsEvents = require('@domain/onboardingDocuments/events');

const CONTEXT_BUCKET_MAP = Object.freeze({
    'user-documents/': 'documents',
    'onboarding-templates/': 'templates'
});

const detectBucketFromKey = (key, defaultBucket = 'documents') => {
    for (const [prefix, bucket] of Object.entries(CONTEXT_BUCKET_MAP)) {
        if (key && key.startsWith(prefix)) {
            return bucket;
        }
    }

    return defaultBucket;
};

module.exports = ({
    onboardingDocumentsRepository,
    sideEffectOutboxService,
    fileGateway,
    logger,
    membershipAccessPort
}) => ({
    onboardingDocumentsRepository,
    sideEffectOutboxService,
    fileGateway,
    logger,
    membershipAccessPort,
    onboardingDocumentsEvents: createOnboardingDocumentsEvents({
        sideEffectOutboxService
    }),
    detectBucketFromKey
});
