const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const { isCvMimeType, isJobSeekerAttachmentMimeType } = require('@shared/cv/fileTypes');
const {
    sanitizePreferredPositionName,
    normalizePreferredPositionKey
} = require('./preferredPosition');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const dedupe = (values = []) => [
    ...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
];

const create = (jobSeekerData = {}, options = {}) => {
    const uploadedCv = options.uploadedCv || null;
    const uploadedAttachments = Array.isArray(options.uploadedAttachments) ? options.uploadedAttachments : [];

    if (!Array.isArray(jobSeekerData.organization_ids) || jobSeekerData.organization_ids.length === 0) {
        failValidation('organization_ids must be a non-empty array of organization IDs');
    }
    const organizationIds = dedupe(jobSeekerData.organization_ids);

    const preferredPositionName = sanitizePreferredPositionName(jobSeekerData.preferred_position_name);
    const preferredPositionKey = normalizePreferredPositionKey(preferredPositionName);

    if (!jobSeekerData.first_name || !jobSeekerData.last_name || !jobSeekerData.email || !jobSeekerData.phone) {
        failValidation('Missing required fields: firstName, lastName, email, phone, preferredPosition');
    }
    if (jobSeekerData.gdpr_consent !== true) {
        failValidation('GDPR consent is required');
    }
    if (!uploadedCv?.bucket || !uploadedCv?.key) {
        failValidation('CV file is required for job seeker submission');
    }
    if (!isCvMimeType(uploadedCv.mimetype)) {
        failValidation('Unsupported CV file type');
    }
    if (organizationIds.length === 0) {
        failValidation('At least one valid organization ID is required');
    }
    if (!preferredPositionName || !preferredPositionKey) {
        failValidation('Preferred position is required for job seeker submission');
    }
    if (uploadedAttachments.length > 4) {
        failValidation('A maximum of 4 additional attachments is allowed');
    }

    for (const attachment of uploadedAttachments) {
        if (!attachment?.mimetype || !isJobSeekerAttachmentMimeType(attachment.mimetype)) {
            failValidation('Unsupported additional attachment file type');
        }
    }

    return Object.freeze({
        jobSeekerData: Object.freeze({
            ...jobSeekerData,
            message: jobSeekerData.message || null,
            gdpr_consent: true,
            organization_ids: organizationIds,
            preferred_position_name: preferredPositionName,
            preferred_position_key: preferredPositionKey
        }),
        uploadedCv: Object.freeze({ ...uploadedCv }),
        uploadedAttachments: Object.freeze(uploadedAttachments.map((file) => Object.freeze({ ...file }))),
        organizationIds: Object.freeze(organizationIds),
        primaryOrganizationId: organizationIds[0] || null,
        requestId: options.requestId || null
    });
};

module.exports = Object.freeze({
    create
});
