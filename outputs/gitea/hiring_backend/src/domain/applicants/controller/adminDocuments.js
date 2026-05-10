module.exports = ({
    applicantsService,
    documentsService,
    fileDownload,
    logger
}) => {
    const { downloadFile } = fileDownload;

    const downloadAttachmentSecure = async (req, res, next) => {
        try {
            const { attachmentId } = req.params;
            const fileInfo = await applicantsService.getAttachmentById(attachmentId, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });

            if (!fileInfo) {
                return res.status(404).json({ message: 'Attachment not found' });
            }

            await downloadFile(res, fileInfo, req.user, 'applicant-attachment', {
                resourceId: attachmentId
            });
        } catch (err) {
            logger.error('Download attachment error', {
                error: err.message,
                attachmentId: req.params.attachmentId
            });
            next(err);
        }
    };

    const updateAttachmentStatusAdmin = async (req, res, next) => {
        try {
            const { attachmentId } = req.params;
            const { status, review_notes } = req.body;

            if (!status) {
                return res.status(400).json({ message: 'Status is required' });
            }

            const attachment = await applicantsService.getAttachmentById(attachmentId, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!attachment) {
                return res.status(404).json({ message: 'Attachment not found' });
            }

            const updatedAttachment = await applicantsService.updateAttachmentStatus(attachmentId, {
                status,
                reviewed_by: req.user.id,
                review_notes: review_notes || null
            }, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });

            if (!updatedAttachment) {
                return res.status(404).json({ message: 'Failed to update attachment status' });
            }

            logger.info('Document status updated', {
                userId: req.user.id,
                attachmentId,
                status
            });

            res.json(updatedAttachment);
        } catch (err) {
            logger.error('Update attachment status error', {
                error: err.message,
                attachmentId: req.params.attachmentId
            });
            next(err);
        }
    };

    const getDocumentStatusesAdmin = async (_req, res, next) => {
        try {
            const statuses = await applicantsService.getAllDocumentStatuses();
            res.json(statuses);
        } catch (err) {
            logger.error('Get document statuses error', { error: err.message });
            next(err);
        }
    };

    return {
        downloadAttachmentSecure,
        updateAttachmentStatusAdmin,
        getDocumentStatusesAdmin
    };
};
