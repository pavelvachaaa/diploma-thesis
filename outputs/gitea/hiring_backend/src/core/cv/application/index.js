const CvPublishIntent = require('@core/cv/domain/CvPublishIntent');

module.exports = ({
    cvPendingAnalysisStorePort,
    cvPublishOutboxPort
}) => {
    const queueApplicantAttachmentPublishIntent = async (input = {}, options = {}) => {
        const intent = CvPublishIntent.createApplicantAttachmentPublish(input);
        if (!intent) {
            return null;
        }

        await cvPendingAnalysisStorePort.createApplicantPendingAnalysis({
            attachmentId: intent.attachmentId,
            applicantId: intent.applicantId,
            organizationId: intent.organizationId
        }, { client: options.client || null });

        return cvPublishOutboxPort.enqueue(intent, options);
    };

    const queueApplicantReanalysisPublishIntent = async (input = {}, options = {}) => {
        const intent = CvPublishIntent.createApplicantReanalysis(input);

        await cvPendingAnalysisStorePort.createApplicantPendingAnalysis({
            attachmentId: intent.attachmentId,
            applicantId: intent.applicantId,
            organizationId: intent.organizationId
        }, { client: options.client || null });

        return cvPublishOutboxPort.enqueue(intent, options);
    };

    const queueJobSeekerCvPublishIntent = async (input = {}, options = {}) => {
        const intent = CvPublishIntent.createJobSeekerCvPublish(input);

        await cvPendingAnalysisStorePort.createJobSeekerPendingAnalysis({
            jobSeekerId: intent.jobSeekerId,
            organizationId: intent.organizationId
        }, { client: options.client || null });

        return cvPublishOutboxPort.enqueue(intent, options);
    };

    const queueJobEmbeddingRequestIntent = (input = {}, options = {}) =>
        cvPublishOutboxPort.enqueue(CvPublishIntent.createJobEmbeddingRequest(input), options);

    return {
        queueApplicantAttachmentPublishIntent,
        queueApplicantReanalysisPublishIntent,
        queueJobSeekerCvPublishIntent,
        queueJobEmbeddingRequestIntent
    };
};
