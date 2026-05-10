const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const CvFile = require('@core/cv/domain/CvFile');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const resolveJobSeekerOrganizationId = (jobSeeker = {}) => {
    if (jobSeeker.organization_id) {
        return jobSeeker.organization_id;
    }

    if (Array.isArray(jobSeeker.organization_ids) && jobSeeker.organization_ids.length > 0) {
        return jobSeeker.organization_ids[0];
    }

    return null;
};

const createApplicantAttachmentPublish = ({
    attachment,
    applicantId,
    organizationId = null,
    fileData,
    jobInfo = {},
    requestId = null
} = {}) => {
    const file = CvFile.createSupportedFile(fileData);

    if (!file) {
        return null;
    }

    if (!attachment?.id || !applicantId) {
        failValidation('attachment.id and applicantId are required for applicant CV publish enqueue');
    }

    return Object.freeze({
        kind: 'applicantAttachmentPublish',
        attachmentId: attachment.id,
        applicantId,
        organizationId: jobInfo.organization_id || organizationId || null,
        jobPostingId: jobInfo.job_posting_id || null,
        jobTitle: jobInfo.title || '',
        jobDescription: jobInfo.description || '',
        file,
        requestId
    });
};

const createApplicantReanalysis = ({
    attachmentInfo,
    applicantId,
    requestId
} = {}) => {
    if (!attachmentInfo?.attachment_id || !applicantId || !requestId) {
        failValidation('attachmentInfo.attachment_id, applicantId, and requestId are required for applicant reanalysis enqueue');
    }

    const file = Object.freeze({
        key: attachmentInfo.file_path,
        bucket: attachmentInfo.bucket || CvFile.detectBucketFromKey(attachmentInfo.file_path),
        mimetype: attachmentInfo.mime_type,
        originalName: attachmentInfo.original_filename
    });

    return Object.freeze({
        kind: 'applicantReanalysis',
        attachmentId: attachmentInfo.attachment_id,
        applicantId,
        organizationId: attachmentInfo.organization_id || null,
        jobPostingId: attachmentInfo.job_posting_id || null,
        jobTitle: attachmentInfo.job_title || '',
        jobDescription: attachmentInfo.job_description || '',
        file,
        requestId
    });
};

const createJobSeekerCvPublish = ({
    jobSeeker,
    requestId = null,
    reanalysis = false
} = {}) => {
    if (!jobSeeker?.id || !jobSeeker?.cv_file_path) {
        failValidation('jobSeeker.id and jobSeeker.cv_file_path are required for job seeker CV publish enqueue');
    }

    if (reanalysis && !requestId) {
        failValidation('requestId is required for job seeker CV reanalysis enqueue');
    }

    const file = Object.freeze({
        key: jobSeeker.cv_file_path,
        bucket: jobSeeker.cv_bucket || CvFile.detectBucketFromKey(jobSeeker.cv_file_path, 'cv-uploads'),
        mimetype: jobSeeker.cv_mime_type,
        originalName: jobSeeker.cv_original_filename
    });

    return Object.freeze({
        kind: 'jobSeekerCvPublish',
        jobSeekerId: jobSeeker.id,
        organizationId: resolveJobSeekerOrganizationId(jobSeeker),
        file,
        requestId,
        reanalysis: Boolean(reanalysis)
    });
};

const createJobEmbeddingRequest = ({
    job,
    contentHash,
    requestId = null,
    organizationId = null
} = {}) => {
    if (!job?.id || !contentHash) {
        failValidation('job.id and contentHash are required for job embedding enqueue');
    }

    return Object.freeze({
        kind: 'jobEmbeddingRequest',
        jobId: job.id,
        organizationId: organizationId || job.organization_id || null,
        contentHash,
        title: job.title || '',
        description: job.description || '',
        requirements: (job.sections?.requirements || []).join('\n'),
        duties: (job.sections?.duties || []).join('\n'),
        requestId
    });
};

module.exports = Object.freeze({
    createApplicantAttachmentPublish,
    createApplicantReanalysis,
    createJobSeekerCvPublish,
    createJobEmbeddingRequest,
    resolveJobSeekerOrganizationId
});
