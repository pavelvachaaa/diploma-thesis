const CONTEXT_RESOURCE_TYPES = {
    'applicant-attachment': 'applicant-attachment',
    'chat-attachment': 'chat-attachment',
    'user-document': 'user-document',
    'employee-document': 'employee-document',
    'onboarding-template': 'onboarding-template',
    'onboarding-document': 'onboarding-document',
    'interview-attachments': 'interview-attachment',
    'organization-contact-photo': 'organization-contact-photo',
    'job-seeker-cv': 'job-seeker-cv',
    'job-seeker-attachment': 'job-seeker-attachment',
    file: 'file'
};

const KEY_PREFIX_RESOURCE_TYPES = {
    'applicant-attachments/': 'applicant-attachment',
    'interview-attachments/': 'interview-attachment',
    'chat-attachments/': 'chat-attachment',
    'user-documents/': 'user-document',
    'onboarding-templates/': 'onboarding-template',
    'organization-contact-photos/': 'organization-contact-photo',
    'job-seekers/': 'job-seeker-cv'
};

const KEY_PREFIX_BUCKETS = {
    'applicant-attachments/': 'attachments',
    'interview-attachments/': 'attachments',
    'chat-attachments/': 'chat-files',
    'user-documents/': 'documents',
    'onboarding-templates/': 'templates',
    'organization-contact-photos/': 'public-organization-photos',
    'job-seekers/': 'cv-uploads'
};

const detectBucketFromKey = (key) => {
    const normalized = String(key || '');
    for (const [prefix, bucket] of Object.entries(KEY_PREFIX_BUCKETS)) {
        if (normalized.startsWith(prefix)) {
            return bucket;
        }
    }

    return 'attachments';
};

const detectResourceTypeFromKey = (key) => {
    const normalized = String(key || '');
    if (!normalized) return null;

    for (const [prefix, resourceType] of Object.entries(KEY_PREFIX_RESOURCE_TYPES)) {
        if (normalized.startsWith(prefix)) {
            return resourceType;
        }
    }

    return null;
};

const resolveResourceType = (context, filePath, eventAudit = {}) => {
    if (eventAudit.resourceType) return eventAudit.resourceType;
    if (CONTEXT_RESOURCE_TYPES[context]) return CONTEXT_RESOURCE_TYPES[context];
    return detectResourceTypeFromKey(filePath) || 'file';
};

const resolveResourceId = (fileInfo = {}, eventAudit = {}) => {
    if (eventAudit.resourceId) return eventAudit.resourceId;

    return fileInfo.resource_id
        || fileInfo.resourceId
        || fileInfo.id
        || fileInfo.attachment_id
        || fileInfo.attachmentId
        || fileInfo.document_id
        || fileInfo.documentId
        || null;
};

module.exports = {
    detectBucketFromKey,
    detectResourceTypeFromKey,
    resolveResourceType,
    resolveResourceId
};
