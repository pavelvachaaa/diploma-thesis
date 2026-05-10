const { isCvMimeType } = require('@shared/cv/fileTypes');

module.exports = ({
    documentsRepository,
    cvIntentPort,
    logger
}) => {
    const maybeQueueApplicantCvPublish = async ({
        attachment,
        applicantId,
        organizationId,
        fileData
    }, { client }) => {
        const isCvAttachment = isCvMimeType(fileData.mimetype) === true;
        if (!fileData.key || !isCvAttachment) {
            return;
        }

        const jobInfo = await documentsRepository.getApplicantJobInfo(applicantId, { client });

        await cvIntentPort.queueApplicantAttachmentPublishIntent({
            attachment,
            applicantId,
            organizationId,
            fileData,
            jobInfo
        }, {
            client
        });

        logger.info('CV analysis pending record and side effect outbox event queued', {
            applicantId,
            attachmentId: attachment.id
        });
    };

    return {
        maybeQueueApplicantCvPublish
    };
};
