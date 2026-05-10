const SkillsSearchRequest = require('@core/jobSeekerCvAnalysis/domain/SkillsSearchRequest');
const MatchingRequest = require('@core/jobSeekerCvAnalysis/domain/MatchingRequest');
const PendingAnalysis = require('@core/jobSeekerCvAnalysis/domain/PendingAnalysis');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({
    jobSeekerCvAnalysisStorePort,
    jobSeekerCvAnalysisUnitOfWorkPort,
    cvIntentPort,
    logger
}) => {
    const getAnalysis = (jobSeekerId, options = {}) =>
        jobSeekerCvAnalysisStorePort.getByJobSeekerId(jobSeekerId, options);

    const getStatus = (jobSeekerId, options = {}) =>
        jobSeekerCvAnalysisStorePort.getStatusByJobSeekerId(jobSeekerId, options);

    const createPendingAnalysis = (data, options = {}) =>
        jobSeekerCvAnalysisStorePort.createOrUpdatePending(PendingAnalysis.create(data), options);

    const enqueueJobSeekerCvPublish = async ({ jobSeeker, requestId = null, reanalysis = false }) => {
        await jobSeekerCvAnalysisUnitOfWorkPort.runInTransaction(async (client) => {
            await cvIntentPort.queueJobSeekerCvPublishIntent({
                jobSeeker,
                requestId,
                reanalysis
            }, { client });
        }, { label: 'jobSeekerCvAnalysis.enqueueJobSeekerCvPublish', requestId });
    };

    const searchBySkills = async (skills, options = {}) => {
        const request = SkillsSearchRequest.create({ skills, limit: options.limit });
        const results = await jobSeekerCvAnalysisStorePort.searchBySkills(request.skills, {
            ...options,
            limit: request.limit
        });

        return Object.freeze({
            skills: request.skills,
            count: results.length,
            results
        });
    };

    const findMatchingJobSeekers = (jobEmbedding, options = {}) => {
        const request = MatchingRequest.create(jobEmbedding, options);
        return jobSeekerCvAnalysisStorePort.findMatchingByEmbedding(request.embedding, {
            ...options,
            limit: request.limit,
            threshold: request.threshold
        });
    };

    const getStats = (options = {}) => jobSeekerCvAnalysisStorePort.getStats(options);

    const triggerAnalysis = async (jobSeeker) => {
        if (!jobSeeker?.cv_file_path) {
            throw new ApplicationError('No CV file found for this job seeker', { code: ErrorCode.NOT_FOUND });
        }

        await enqueueJobSeekerCvPublish({
            jobSeeker,
            requestId: null,
            reanalysis: false
        });

        logger?.info?.('Job seeker CV analysis triggered', {
            jobSeekerId: jobSeeker.id,
            cvPath: jobSeeker.cv_file_path
        });

        return { message: 'CV analysis has been queued', status: 'pending' };
    };

    const triggerReanalysis = async (jobSeekerId, jobSeekerData, options = {}) => {
        if (!jobSeekerData?.cv_file_path) {
            throw new ApplicationError('No CV file found for this job seeker', { code: ErrorCode.NOT_FOUND });
        }

        const requestId = options.requestId || `manual-${Date.now()}`;

        await enqueueJobSeekerCvPublish({
            jobSeeker: jobSeekerData,
            requestId,
            reanalysis: true
        });

        logger?.info?.('Job seeker CV reanalysis triggered', {
            jobSeekerId,
            cvPath: jobSeekerData.cv_file_path
        });

        return { message: 'CV analysis has been queued', status: 'pending' };
    };

    return {
        getAnalysis,
        getStatus,
        createPendingAnalysis,
        searchBySkills,
        findMatchingJobSeekers,
        getStats,
        triggerAnalysis,
        triggerReanalysis
    };
};
