const { createHttpError } = require('./shared');

module.exports = ({ calendarService, logger, fileDownload }) => {
    const uploadAttachment = async (req, res, next) => {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const attachment = await calendarService.uploadAttachment(id, req.file, req.user.id, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });

            logger.info('Attachment uploaded to interview', {
                interviewId: id,
                attachmentId: attachment.id,
                userId: req.user.id,
                filename: req.file.originalname
            });

            res.status(201).json(attachment);
        } catch (error) {
            logger.error('Failed to upload attachment', {
                error: error.message,
                interviewId: req.params.id,
                userId: req.user?.id
            });
            next(error);
        }
    };

    const downloadAttachment = async (req, res, next) => {
        try {
            const { attachmentId } = req.params;

            const attachment = await calendarService.getAttachmentById(attachmentId, {
                actorUserId: req.user.id,
                minAccess: 'read'
            });

            if (!attachment || attachment.interview_id !== req.params.id) {
                throw createHttpError(404, 'Attachment not found');
            }

            const fileInfo = {
                file_path: attachment.file_path,
                original_name: attachment.original_filename,
                mime_type: attachment.mime_type,
                bucket: attachment.bucket || null
            };

            await fileDownload.downloadFile(res, fileInfo, req.user, 'interview-attachments', {
                resourceId: attachmentId,
                metadata: {
                    interviewId: req.params.id
                }
            });

        } catch (error) {
            logger.error('Failed to download attachment', {
                error: error.message,
                interviewId: req.params.id,
                attachmentId: req.params.attachmentId,
                userId: req.user?.id
            });
            next(error);
        }
    };

    const deleteAttachment = async (req, res, next) => {
        try {
            const { id, attachmentId } = req.params;

            const attachment = await calendarService.getAttachmentById(attachmentId, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });
            if (!attachment || attachment.interview_id !== id) {
                throw createHttpError(404, 'Attachment not found');
            }

            const success = await calendarService.deleteAttachment(attachmentId, req.user.id, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });

            if (!success) {
                throw createHttpError(404, 'Attachment not found');
            }

            logger.info('Attachment deleted from interview', {
                interviewId: id,
                attachmentId,
                userId: req.user.id
            });

            res.json({ message: 'Attachment deleted successfully' });
        } catch (error) {
            logger.error('Failed to delete attachment', {
                error: error.message,
                interviewId: req.params.id,
                attachmentId: req.params.attachmentId,
                userId: req.user?.id
            });
            next(error);
        }
    };

    return {
        uploadAttachment,
        downloadAttachment,
        deleteAttachment
    };
};
