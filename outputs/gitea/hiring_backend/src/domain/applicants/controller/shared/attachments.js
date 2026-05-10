const { multerFileToUpload } = require('@shared/file/uploadedFile');

module.exports = ({ documentsService, applicantContracts, jobSeekersAccessPort }) => {
    const mapUploadedFileToAttachmentInput = (file) => {
        const upload = multerFileToUpload(file);
        return upload && {
            ...upload,
            filename: file.originalname
        };
    };

    const mapJobSeekerAttachmentToAttachmentInput = (attachment) => ({
        originalName: attachment.original_filename || 'attachment',
        filename: attachment.original_filename || 'attachment',
        key: attachment.file_path,
        bucket: attachment.bucket || null,
        mimetype: attachment.mime_type || 'application/octet-stream',
        size: attachment.file_size || 0
    });

    const appendStoredAttachmentsFromFiles = async (applicantId, files, attachments) => {
        if (!files || files.length === 0) {
            return attachments;
        }

        for (const file of files) {
            const storedAttachment = await documentsService.storeApplicantAttachment(
                applicantId,
                mapUploadedFileToAttachmentInput(file)
            );
            attachments.push(applicantContracts.toAttachmentResponse(storedAttachment));
        }

        return attachments;
    };

    const appendStoredAttachmentsFromJobSeeker = async (applicantId, jobSeekerId, attachments) => {
        if (!jobSeekerId) {
            return attachments;
        }

        const jobSeeker = await jobSeekersAccessPort.getJobSeekerById(jobSeekerId);

        if (jobSeeker && jobSeeker.cv_file_path) {
            const cvAttachment = await documentsService.storeApplicantAttachment(applicantId, {
                originalName: jobSeeker.cv_original_filename || jobSeeker.cv_filename || 'cv.pdf',
                filename: jobSeeker.cv_filename || jobSeeker.cv_original_filename || 'cv.pdf',
                key: jobSeeker.cv_file_path,
                mimetype: jobSeeker.cv_mime_type || 'application/pdf',
                size: jobSeeker.cv_file_size || 0
            });
            attachments.push(applicantContracts.toAttachmentResponse(cvAttachment));
        }

        const seekerAttachments = await jobSeekersAccessPort.getAttachmentsByJobSeekerId(jobSeekerId);
        for (const seekerAttachment of seekerAttachments) {
            const storedAttachment = await documentsService.storeApplicantAttachment(
                applicantId,
                mapJobSeekerAttachmentToAttachmentInput(seekerAttachment)
            );
            attachments.push(applicantContracts.toAttachmentResponse(storedAttachment));
        }

        return attachments;
    };

    return {
        appendStoredAttachmentsFromFiles,
        appendStoredAttachmentsFromJobSeeker
    };
};
