const createGetJobs = require('./getJobs');
const createGetJobsAdmin = require('./getJobsAdmin');
const createGetJobDetail = require('./getJobDetail');
const createGetJobDetailAdmin = require('./getJobDetailAdmin');
const createCreateJob = require('./createJob');
const createUpdateJob = require('./updateJob');
const createDeleteJob = require('./deleteJob');
const createDuplicateJob = require('./duplicateJob');
const createUpdateAuthorizedPeople = require('./updateAuthorizedPeople');
const createGetMatchingJobSeekers = require('./getMatchingJobSeekers');
const createGetJobEmbeddingStatus = require('./getJobEmbeddingStatus');
const createGetOrRequestJobEmbedding = require('./getOrRequestJobEmbedding');

module.exports = (deps) => {
    const {
        jobsStorePort,
        jobEmbeddingsStorePort,
        jobsAuditPort,
        jobsOutboxPort,
        membershipAccessPort,
        sectionItemsStorePort,
        jobPermissionPort,
        internalUserProvisioningPort,
        jobSeekerCvAnalysisQueryPort,
        logger
    } = deps;

    const getJobs = createGetJobs({ jobsStorePort });
    const getJobsAdmin = createGetJobsAdmin({ jobsStorePort });
    const getJobDetail = createGetJobDetail({ jobsStorePort });
    const getJobDetailAdmin = createGetJobDetailAdmin({ jobsStorePort, jobPermissionPort });
    const getJobById = (jobId, options = {}) => jobsStorePort.getJobById(jobId, options);
    const createJob = createCreateJob({ jobsStorePort, jobsAuditPort, jobsOutboxPort, membershipAccessPort, sectionItemsStorePort, jobPermissionPort });
    const updateJob = createUpdateJob({ jobsStorePort, jobsAuditPort, jobsOutboxPort, sectionItemsStorePort, jobPermissionPort });
    const deleteJob = createDeleteJob({ jobsStorePort, jobsAuditPort });
    const duplicateJob = createDuplicateJob({ jobsStorePort, jobsAuditPort, jobsOutboxPort, jobPermissionPort });
    const updateAuthorizedPeople = createUpdateAuthorizedPeople({ jobsStorePort, jobsOutboxPort, internalUserProvisioningPort, jobPermissionPort });
    const getMatchingJobSeekers = createGetMatchingJobSeekers({ jobsStorePort, jobEmbeddingsStorePort, jobsOutboxPort, jobSeekerCvAnalysisQueryPort, logger });
    const getJobEmbeddingStatus = createGetJobEmbeddingStatus({ jobsStorePort, jobEmbeddingsStorePort });
    const getOrRequestEmbedding = createGetOrRequestJobEmbedding({ jobEmbeddingsStorePort, jobsStorePort, jobsOutboxPort, logger });

    const getStatus = async (jobId) => {
        const record = await jobEmbeddingsStorePort.getByJobId(jobId);
        if (!record) return null;
        return { status: record.status, error_message: record.error_message, created_at: record.created_at, processed_at: record.processed_at };
    };

    return {
        getJobs,
        getJobsAdmin,
        getJobDetail,
        getJobDetailAdmin,
        getJobById,
        createJob,
        updateJob,
        deleteJob,
        duplicateJob,
        updateAuthorizedPeople,
        getMatchingJobSeekers,
        getJobEmbeddingStatus,
        getOrRequestEmbedding,
        getStatus
    };
};
