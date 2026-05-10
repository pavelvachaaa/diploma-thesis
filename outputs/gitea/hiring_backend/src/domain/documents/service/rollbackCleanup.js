const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');

module.exports = ({
    sideEffectOutboxService,
    detectBucketFromKey,
    logger
}) => {
    const queueRollbackCleanup = async ({
        applicantId,
        fileData,
        organizationId
    }) => {
        if (!fileData.key) {
            return;
        }

        try {
            await enqueueFileGcDelete({
                sideEffectOutboxService,
                bucket: fileData.bucket || detectBucketFromKey(fileData.key),
                objectKey: fileData.key,
                organizationId,
                reason: 'transaction_rollback_cleanup',
                sourceModule: 'documents.applicantAttachments'
            });
            logger.info('Queued rollback cleanup for uploaded applicant attachment', {
                applicantId,
                key: fileData.key
            });
        } catch (cleanupError) {
            logger.error('Failed to queue rollback cleanup for applicant attachment', {
                error: cleanupError.message,
                applicantId,
                key: fileData.key
            });
        }
    };

    return {
        queueRollbackCleanup
    };
};
