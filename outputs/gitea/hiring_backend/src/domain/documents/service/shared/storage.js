const CONTEXT_BUCKET_MAP = {
    'applicant-attachments/': 'attachments',
    'interview-attachments/': 'attachments',
    'chat-attachments/': 'chat-files',
    'user-documents/': 'documents',
    'onboarding-templates/': 'templates',
    'job-seekers/': 'cv-uploads',
};

const detectBucketFromKey = (key, defaultBucket = 'attachments') => {
    for (const [prefix, bucket] of Object.entries(CONTEXT_BUCKET_MAP)) {
        if (key && key.startsWith(prefix)) {
            return bucket;
        }
    }

    return defaultBucket;
};

module.exports = {
    detectBucketFromKey,
    CONTEXT_BUCKET_MAP
};
