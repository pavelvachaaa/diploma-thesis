const createTxRunner = require('@platform/transaction/createTxRunner');
const createAttachmentStorage = require('./attachmentStorage');
const createCvPublish = require('./cvPublish');
const createRollbackCleanup = require('./rollbackCleanup');

module.exports = ({
    db,
    documentsRepository,
    documentsEvents,
    logger,
    sideEffectOutboxService,
    fileGateway,
    detectBucketFromKey,
    cvIntentPort,
    transactionManager
}) => {
    const tx = createTxRunner({
        db,
        transactionManager,
        logger,
        defaultLabel: 'documents.applicantAttachments'
    });
    const { storeAttachmentRecord } = createAttachmentStorage({
        documentsRepository,
        fileGateway,
        detectBucketFromKey
    });
    const { maybeQueueApplicantCvPublish } = createCvPublish({
        documentsRepository,
        cvIntentPort,
        logger
    });
    const { queueRollbackCleanup } = createRollbackCleanup({
        sideEffectOutboxService,
        detectBucketFromKey,
        logger
    });

    const storeApplicantAttachment = async (applicantId, fileData) => {
        let attachment = null;
        let organizationId = null;

        try {
            await tx.runInTransaction(async (client) => {
                const result = await storeAttachmentRecord({
                    applicantId,
                    fileData
                }, { client });

                attachment = result.attachment;
                organizationId = result.organizationId;

                await maybeQueueApplicantCvPublish({
                    attachment,
                    applicantId,
                    organizationId,
                    fileData
                }, {
                    client
                });

                await documentsEvents.enqueueApplicantDocumentUploaded({
                    client,
                    organizationId,
                    applicantId,
                    originalName: fileData.originalName,
                    attachmentId: attachment.id
                });
            }, { label: 'documents.storeApplicantAttachment' });
        } catch (error) {
            await queueRollbackCleanup({
                applicantId,
                fileData,
                organizationId
            });

            throw error;
        }

        logger.info('Applicant attachment stored successfully', {
            applicantId,
            filename: fileData.filename,
            originalName: fileData.originalName,
            key: fileData.key,
            size: fileData.size
        });

        return attachment;
    };

    return {
        storeApplicantAttachment
    };
};
