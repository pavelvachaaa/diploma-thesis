const JobSeekerSubmission = require('@core/jobSeekers/domain/JobSeekerSubmission');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({
    jobSeekersStorePort,
    jobSeekersFilePort,
    jobSeekersFileGcPort,
    jobSeekersOrganizationLookupPort,
    cvIntentPort,
    logger
}) => {
    const validateOrganizations = async (organizationIds) => {
        const organizations = await Promise.all(
            organizationIds.map((id) => jobSeekersOrganizationLookupPort.getById(id))
        );
        if (organizations.some((organization) => !organization)) {
            throw new ApplicationError('One or more selected organizations are invalid', {
                code: ErrorCode.VALIDATION_ERROR
            });
        }
    };

    const enqueueRollbackCleanup = async ({ uploadedFiles = [], organizationId = null, originalError }) => {
        const candidates = uploadedFiles.filter((file) => file?.bucket && file?.key);
        if (candidates.length === 0) {
            return;
        }

        try {
            await jobSeekersStorePort.withTransaction(async (cleanupClient) => {
                for (const file of candidates) {
                    await jobSeekersFileGcPort.enqueueDelete({
                        bucket: file.bucket,
                        objectKey: file.key,
                        organizationId,
                        reason: 'transaction_rollback_cleanup',
                        sourceModule: 'jobSeekers.create'
                    }, { client: cleanupClient });
                }
            });
        } catch (cleanupError) {
            logger?.error?.('CRITICAL: rollback cleanup failed, files may be orphaned in object storage', {
                error: cleanupError.message,
                originalError: originalError?.message || null,
                organizationId,
                files: candidates.map((file) => ({ bucket: file.bucket, key: file.key }))
            });
        }
    };

    return async (jobSeekerData, options = {}) => {
        const submission = JobSeekerSubmission.create(jobSeekerData, options);
        await validateOrganizations(submission.organizationIds);

        try {
            return await jobSeekersStorePort.withTransaction(async (client) => {
                const cvFile = await jobSeekersFilePort.createFileRecord({
                    bucket: submission.uploadedCv.bucket,
                    objectKey: submission.uploadedCv.key,
                    mimeType: submission.uploadedCv.mimetype || null,
                    sizeBytes: submission.uploadedCv.size || null,
                    originalFilename: submission.uploadedCv.originalName || null,
                    checksumSha256: submission.uploadedCv.checksum_sha256 || null,
                    organizationId: submission.primaryOrganizationId,
                    uploadedBy: null,
                    sourceModule: 'job_seekers',
                    metadata: {
                        email: submission.jobSeekerData.email || null,
                        role: 'cv'
                    }
                }, { client });

                const attachmentFileIds = [];
                for (const attachment of submission.uploadedAttachments) {
                    if (!attachment?.bucket || !attachment?.key) {
                        continue;
                    }

                    const fileRecord = await jobSeekersFilePort.createFileRecord({
                        bucket: attachment.bucket,
                        objectKey: attachment.key,
                        mimeType: attachment.mimetype || null,
                        sizeBytes: attachment.size || null,
                        originalFilename: attachment.originalName || null,
                        checksumSha256: attachment.checksum_sha256 || null,
                        organizationId: submission.primaryOrganizationId,
                        uploadedBy: null,
                        sourceModule: 'job_seekers',
                        metadata: {
                            email: submission.jobSeekerData.email || null,
                            role: 'additional_attachment'
                        }
                    }, { client });

                    attachmentFileIds.push(fileRecord.id);
                }

                const created = await jobSeekersStorePort.createJobSeeker({
                    ...submission.jobSeekerData,
                    cv_file_id: cvFile.id
                }, { client });

                await jobSeekersStorePort.createJobSeekerLocations(created.id, submission.organizationIds, { client });

                if (attachmentFileIds.length > 0) {
                    await jobSeekersStorePort.createJobSeekerAttachments(created.id, attachmentFileIds, { client });
                }

                await cvIntentPort.queueJobSeekerCvPublishIntent({
                    jobSeeker: {
                        id: created.id,
                        organization_ids: submission.organizationIds,
                        organization_id: submission.primaryOrganizationId,
                        cv_bucket: cvFile.bucket || submission.uploadedCv.bucket,
                        cv_file_path: cvFile.object_key || submission.uploadedCv.key,
                        cv_mime_type: submission.uploadedCv.mimetype || null,
                        cv_original_filename: submission.uploadedCv.originalName || null
                    },
                    requestId: submission.requestId,
                    reanalysis: false
                }, { client });

                const fullJobSeeker = await jobSeekersStorePort.getJobSeekerById(created.id, { client });
                return fullJobSeeker || created;
            });
        } catch (error) {
            await enqueueRollbackCleanup({
                uploadedFiles: [submission.uploadedCv, ...submission.uploadedAttachments],
                organizationId: submission.primaryOrganizationId,
                originalError: error
            });

            throw error;
        }
    };
};
