const CV_MIME_TYPES = Object.freeze([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const JOB_SEEKER_ATTACHMENT_MIME_TYPES = Object.freeze([
    ...CV_MIME_TYPES,
    'image/jpeg',
    'image/png',
    'image/jpg'
]);

const CV_MIME_TYPES_SET = new Set(CV_MIME_TYPES);
const JOB_SEEKER_ATTACHMENT_MIME_TYPES_SET = new Set(JOB_SEEKER_ATTACHMENT_MIME_TYPES);

const isCvMimeType = (mimeType) => CV_MIME_TYPES_SET.has(String(mimeType || '').toLowerCase());

const isJobSeekerAttachmentMimeType = (mimeType) =>
    JOB_SEEKER_ATTACHMENT_MIME_TYPES_SET.has(String(mimeType || '').toLowerCase());

module.exports = {
    CV_MIME_TYPES,
    JOB_SEEKER_ATTACHMENT_MIME_TYPES,
    isCvMimeType,
    isJobSeekerAttachmentMimeType
};
