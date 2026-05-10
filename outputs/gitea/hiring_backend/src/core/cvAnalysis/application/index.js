const SkillsSearchRequest = require('@core/cvAnalysis/domain/SkillsSearchRequest');
const PendingAnalysis = require('@core/cvAnalysis/domain/PendingAnalysis');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({
    cvAnalysisStorePort,
    cvAnalysisUnitOfWorkPort,
    cvIntentPort,
    logger
}) => {
    const getAnalysis = (applicantId, options = {}) =>
        cvAnalysisStorePort.getByApplicantId(applicantId, options);

    const getAnalysisByAttachment = (attachmentId, options = {}) =>
        cvAnalysisStorePort.getByAttachmentId(attachmentId, options);

    const searchBySkills = async (skills, options = {}) => {
        const request = SkillsSearchRequest.create({ skills, limit: options.limit });
        const results = await cvAnalysisStorePort.searchBySkills(request.skills, {
            ...options,
            limit: request.limit
        });

        return Object.freeze({
            skills: request.skills,
            count: results.length,
            results
        });
    };

    const getStats = (options = {}) => cvAnalysisStorePort.getStats(options);

    const getStatus = (applicantId, options = {}) =>
        cvAnalysisStorePort.getStatusByApplicantId(applicantId, options);

    const createPendingAnalysis = (data, options = {}) =>
        cvAnalysisStorePort.createOrUpdatePending(PendingAnalysis.create(data), options);

    const triggerReanalysis = async (applicantId, options = {}) => {
        const attachmentInfo = await cvAnalysisStorePort.getApplicantAttachmentInfo(applicantId, options);

        if (!attachmentInfo) {
            throw new ApplicationError('No CV attachment found for this applicant', { code: ErrorCode.NOT_FOUND });
        }

        const requestId = options.requestId || `manual-${Date.now()}`;

        await cvAnalysisUnitOfWorkPort.runInTransaction(async (client) => {
            await cvIntentPort.queueApplicantReanalysisPublishIntent({
                attachmentInfo,
                applicantId,
                requestId
            }, { client });
        }, { label: 'cvAnalysis.triggerReanalysis', requestId });

        logger?.info?.('CV reanalysis triggered', { applicantId, attachmentId: attachmentInfo.attachment_id });

        return { message: 'CV reanalysis has been queued', status: 'pending' };
    };

    return {
        getAnalysis,
        getAnalysisByAttachment,
        searchBySkills,
        getStats,
        getStatus,
        createPendingAnalysis,
        triggerReanalysis
    };
};
