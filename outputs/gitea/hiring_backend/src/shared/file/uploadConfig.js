const CONTEXT_BUCKETS = {
    'applicant-attachments': 'attachments',
    'chat-attachments': 'chat-files',
    'user-documents': 'documents',
    'onboarding-templates': 'templates',
    'job-seekers': 'cv-uploads',
    'interview-attachments': 'attachments',
    'organization-contact-photos': 'public-organization-photos'
};

const UPLOAD_CONTEXTS = {
    'applicant-attachments': {
        prefix: 'attachment',
        maxSize: 5 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]
    },
    'chat-attachments': {
        prefix: 'chat',
        maxSize: 10 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/gif',
            'text/plain'
        ]
    },
    'user-documents': {
        prefix: 'document',
        maxSize: 10 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]
    },
    'onboarding-templates': {
        prefix: 'template',
        maxSize: 50 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif'
        ]
    },
    'job-seekers': {
        prefix: 'cv',
        maxSize: 5 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },
    'interview-attachments': {
        prefix: 'interview',
        maxSize: 10 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]
    },
    'organization-contact-photos': {
        prefix: 'organization-contact-photo',
        maxSize: 5 * 1024 * 1024,
        cacheControl: 'public, max-age=31536000, immutable',
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]
    }
};

const MIME_TO_EXTENSIONS = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/jpg': 'JPG',
    'image/gif': 'GIF'
};

const getBucketForContext = (context) => CONTEXT_BUCKETS[context] || 'attachments';

const getExtensionFromMimeType = (mimeType) => MIME_TO_EXTENSIONS[mimeType];

const getFileType = (mimeType) => getExtensionFromMimeType(mimeType) || 'UNKNOWN';

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const validateContext = (context) => {
    if (!UPLOAD_CONTEXTS[context]) {
        throw new Error(`Invalid file upload context: ${context}. Valid contexts: ${Object.keys(UPLOAD_CONTEXTS).join(', ')}`);
    }
};

const getUploadConfig = (context) => {
    validateContext(context);
    return UPLOAD_CONTEXTS[context];
};

module.exports = {
    CONTEXT_BUCKETS,
    UPLOAD_CONTEXTS,
    getBucketForContext,
    getExtensionFromMimeType,
    getFileType,
    formatFileSize,
    validateContext,
    getUploadConfig
};
