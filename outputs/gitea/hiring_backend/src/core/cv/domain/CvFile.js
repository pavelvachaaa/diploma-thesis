const { CV_MIME_TYPES, isCvMimeType } = require('@shared/cv/fileTypes');

const CONTEXT_BUCKET_MAP = Object.freeze({
    'applicant-attachments/': 'attachments',
    'interview-attachments/': 'attachments',
    'chat-attachments/': 'chat-files',
    'user-documents/': 'documents',
    'onboarding-templates/': 'templates',
    'job-seekers/': 'cv-uploads'
});

const detectBucketFromKey = (key, defaultBucket = 'attachments') => {
    for (const [prefix, bucket] of Object.entries(CONTEXT_BUCKET_MAP)) {
        if (key && key.startsWith(prefix)) {
            return bucket;
        }
    }

    return defaultBucket;
};

const createSupportedFile = (fileData = {}) => {
    if (!fileData?.key || !isCvMimeType(fileData.mimetype)) {
        return null;
    }

    return Object.freeze({
        key: fileData.key,
        bucket: fileData.bucket || detectBucketFromKey(fileData.key),
        mimetype: fileData.mimetype,
        originalName: fileData.originalName
    });
};

module.exports = Object.freeze({
    CV_MIME_TYPES,
    CONTEXT_BUCKET_MAP,
    isCvMimeType,
    detectBucketFromKey,
    createSupportedFile
});
