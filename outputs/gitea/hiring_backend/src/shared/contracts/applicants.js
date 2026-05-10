const buildApplicantInput = (payload = {}, overrides = {}) => ({
    name: payload.name || payload.firstName,
    surname: payload.surname || payload.lastName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    zip: payload.zip,
    education: payload.education,
    field: payload.field,
    experience: payload.experience,
    last_employer: payload.last_employer || payload.lastEmployer,
    last_position: payload.last_position || payload.lastPosition,
    gdpr_consent: payload.gdpr_consent,
    job_posting_id: payload.job_posting_id,
    organization_id: payload.organization_id,
    ...overrides
});

const buildPublicApplicationInput = (payload = {}, context = {}) => buildApplicantInput(payload, {
    gdpr_consent: payload.gdprConsent === 'true' || payload.gdprConsent === true,
    job_posting_id: context.jobPostingId || payload.job_posting_id,
    organization_id: context.organizationId || payload.organization_id
});

const buildAdminApplicantInput = (payload = {}, context = {}) => buildApplicantInput(payload, {
    gdpr_consent: payload.gdpr_consent === 'true'
        || payload.gdpr_consent === true
        || payload.gdprConsent === 'true'
        || payload.gdprConsent === true
        || true,
    organization_id: context.organizationId || payload.organization_id
});

const toAttachmentResponse = (attachment) => ({
    id: attachment.id,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    file_size: attachment.file_size
});

module.exports = {
    buildPublicApplicationInput,
    buildAdminApplicantInput,
    toAttachmentResponse
};
