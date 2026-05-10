const applicantAttachmentUpload = (attachmentId) => `cv.uploaded.attachment.${attachmentId}`;

const applicantReanalysis = (attachmentId, requestId) =>
    `cv.uploaded.reanalysis.${attachmentId}.${requestId}`;

const jobSeekerUploadIdempotencyKey = (jobSeekerId, cvFilePath) =>
    `job_seeker_cv.uploaded.${jobSeekerId}.${cvFilePath}`;

const jobSeekerReanalysisIdempotencyKey = (jobSeekerId, requestId) =>
    `job_seeker_cv.uploaded.reanalysis.${jobSeekerId}.${requestId}`;

const jobEmbeddingRequested = (jobId, contentHash) =>
    `job.embedding.requested.${jobId}.${contentHash}`;

module.exports = {
    applicantAttachmentUpload,
    applicantReanalysis,
    jobSeekerUploadIdempotencyKey,
    jobSeekerReanalysisIdempotencyKey,
    jobEmbeddingRequested
};
