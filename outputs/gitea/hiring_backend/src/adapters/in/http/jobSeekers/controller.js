const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const { handle, sendResult } = require('@shared/http/controller');
const { multerFileToUpload } = require('@shared/file/uploadedFile');

module.exports = ({
    jobSeekersService,
    fileDownload
}) => {

    const parseOrganizationIds = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value !== 'string' || !value.trim()) {
            throw new ApplicationError('organizationIds must be a non-empty JSON array of organization IDs', {
                code: ErrorCode.VALIDATION_ERROR
            });
        }
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
                throw new ApplicationError('organizationIds must be a JSON array', {
                    code: ErrorCode.VALIDATION_ERROR
                });
            }
            return parsed;
        } catch (error) {
            if (error instanceof ApplicationError) throw error;
            throw new ApplicationError('organizationIds must be valid JSON', {
                code: ErrorCode.VALIDATION_ERROR
            });
        }
    };

    const toBoolean = (value) => value === true || value === 'true';

    const submitJobSeekerForm = handle(async (req, res) => {
        const cvFile = req.files?.cv?.[0] || null;
        const additionalFiles = req.files?.attachments || [];
        const jobSeeker = await jobSeekersService.createJobSeeker({
            first_name: req.body?.firstName,
            last_name: req.body?.lastName,
            email: req.body?.email,
            phone: req.body?.phone,
            organization_ids: parseOrganizationIds(req.body?.organizationIds),
            preferred_position_name: req.body?.preferredPosition,
            message: req.body?.message,
            gdpr_consent: toBoolean(req.body?.gdprConsent)
        }, {
            uploadedCv: multerFileToUpload(cvFile),
            uploadedAttachments: additionalFiles.map(multerFileToUpload).filter(Boolean)
        });

        return sendResult(res, {
            message: 'Job seeker form submitted successfully',
            jobSeeker: {
                id: jobSeeker.id,
                first_name: jobSeeker.first_name,
                last_name: jobSeeker.last_name,
                email: jobSeeker.email,
                submitted_at: jobSeeker.submitted_at
            }
        }, 201);
    });

    const getAllJobSeekersAdmin = handle(async (req, res) => {
        const {
            page = 1,
            limit = 10,
            search = '',
            organization = '',
            preferredPosition = '',
            organizationId = null
        } = req.query;

        const result = await jobSeekersService.getAllJobSeekers({
            page,
            limit,
            actorUserId: req.user.id,
            minAccess: 'read',
            search,
            organization,
            organizationId,
            preferredPosition
        });

        return sendResult(res, result);
    });

    const getJobSeekerByIdAdmin = handle(async (req, res) => {
        const jobSeeker = await jobSeekersService.getJobSeekerById(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });
        if (!jobSeeker) {
            return sendResult(res, { message: 'Job seeker not found' }, 404);
        }
        return sendResult(res, jobSeeker);
    });

    const deleteJobSeekerAdmin = handle(async (req, res) => {
        const deletedJobSeeker = await jobSeekersService.deleteJobSeeker(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'write'
        });

        if (!deletedJobSeeker) {
            return sendResult(res, { message: 'Job seeker not found' }, 404);
        }

        return sendResult(res, { message: 'Job seeker deleted successfully' });
    });

    const downloadCVAdmin = handle(async (req, res) => {
        const jobSeeker = await jobSeekersService.getJobSeekerById(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        if (!jobSeeker) {
            return sendResult(res, { message: 'Job seeker not found' }, 404);
        }

        if (!jobSeeker.cv_file_path) {
            return sendResult(res, { message: 'CV file not found for this job seeker' }, 404);
        }

        await fileDownload.downloadFile(res, {
            file_path: jobSeeker.cv_file_path,
            original_name: jobSeeker.cv_original_filename,
            mime_type: jobSeeker.cv_mime_type,
            bucket: jobSeeker.cv_bucket || null
        }, req.user, 'job-seeker-cv', {
            resourceId: req.params.id
        });
    });

    const downloadAttachmentAdmin = handle(async (req, res) => {
        const attachment = await jobSeekersService.getAttachmentById(req.params.id, req.params.attachmentId, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });
        if (!attachment) {
            return sendResult(res, { message: 'Attachment not found for this job seeker' }, 404);
        }

        await fileDownload.downloadFile(res, {
            file_path: attachment.file_path,
            original_name: attachment.original_filename,
            mime_type: attachment.mime_type,
            bucket: attachment.bucket || null
        }, req.user, 'job-seeker-attachment', {
            resourceId: req.params.id,
            metadata: {
                attachmentId: req.params.attachmentId
            }
        });
    });

    const getJobSeekersByOrganizationAdmin = handle(async (req, res) => {
        const jobSeekers = await jobSeekersService.getJobSeekersByOrganization(req.params.organizationId, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });
        return sendResult(res, jobSeekers);
    });

    return {
        submitJobSeekerForm,
        getAllJobSeekersAdmin,
        getJobSeekerByIdAdmin,
        deleteJobSeekerAdmin,
        downloadCVAdmin,
        downloadAttachmentAdmin,
        getJobSeekersByOrganizationAdmin
    };
};
