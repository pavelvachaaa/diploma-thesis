const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');
const createTxRunner = require('@platform/transaction/createTxRunner');

module.exports = ({
    calendarRepository,
    sideEffectOutboxService,
    fileGateway,
    db,
    transactionManager,
    logger
}) => {
    const tx = createTxRunner({
        db,
        transactionManager,
        logger,
        defaultLabel: 'interviews.attachments'
    });

    const uploadAttachment = async (interviewId, file, uploadedBy, options = {}) => {
        const interview = await calendarRepository.getById(interviewId, options);

        if (!interview) {
            throw new Error('Interview not found');
        }

        if (interview.status === 'cancelled' || interview.status === 'completed') {
            throw new Error(`Cannot add attachments to ${interview.status} interview`);
        }

        try {
            return await tx.runInTransaction(async (client) => {
                const fileRecord = await fileGateway.createFileRecord({
                    bucket: file.bucket,
                    objectKey: file.key,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    originalFilename: file.originalname,
                    checksumSha256: file.checksum_sha256 || null,
                    organizationId: interview.organization_id || null,
                    uploadedBy,
                    sourceModule: 'interviews',
                    metadata: {
                        interviewId
                    }
                }, { client });

                return calendarRepository.addAttachment(interviewId, {
                    file_id: fileRecord.id,
                    uploaded_by: uploadedBy
                }, {
                    client,
                    actorUserId: options.actorUserId || null,
                    minAccess: options.minAccess || null
                });
            }, { label: 'interviews.uploadAttachment' });
        } catch (error) {
            if (file?.bucket && file?.key) {
                try {
                    await enqueueFileGcDelete({
                        sideEffectOutboxService,
                        bucket: file.bucket,
                        objectKey: file.key,
                        organizationId: interview.organization_id || null,
                        reason: 'transaction_rollback_cleanup',
                        sourceModule: 'interviews.uploadAttachment'
                    });
                } catch (cleanupError) {
                    logger.error('Failed to enqueue interview attachment rollback cleanup', {
                        error: cleanupError.message,
                        objectKey: file.key
                    });
                }
            }

            throw error;
        }
    };

    const getAttachmentById = async (attachmentId, options = {}) => {
        return await calendarRepository.getAttachmentById(attachmentId, options);
    };

    const deleteAttachment = async (attachmentId, userId, options = {}) => {
        return tx.runInTransaction(async (client) => {
            const attachment = await calendarRepository.deleteAttachment(attachmentId, {
                client,
                actorUserId: options.actorUserId || null,
                minAccess: options.minAccess || null
            });

            if (!attachment) {
                return false;
            }

            const retained = await fileGateway.markRetained(attachment.file_id, {
                client,
                metadata: {
                    removed_from: 'interview_attachments',
                    removed_by: userId
                }
            });

            if (retained) {
                await enqueueFileGcDelete({
                    sideEffectOutboxService,
                    fileId: retained.id,
                    organizationId: null,
                    availableAt: retained.retention_until,
                    reason: 'retention_gc',
                    sourceModule: 'interviews.deleteAttachment'
                }, { client });
            }

            return true;
        }, { label: 'interviews.deleteAttachment' });
    };

    const getAttachments = async (interviewId, options = {}) => {
        return await calendarRepository.getAttachments(interviewId, options);
    };

    return {
        uploadAttachment,
        getAttachmentById,
        deleteAttachment,
        getAttachments
    };
};
