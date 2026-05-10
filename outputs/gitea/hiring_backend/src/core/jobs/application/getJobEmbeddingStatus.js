const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({ jobsStorePort, jobEmbeddingsStorePort }) => async (jobId, actorUserId = null) => {
    const job = await jobsStorePort.getJobDetailAdmin(jobId, {
        actorUserId,
        minAccess: 'read'
    });
    if (!job) {
        throw new ApplicationError('Nabídka práce nebyla nalezena', { code: ErrorCode.NOT_FOUND });
    }

    const status = await jobEmbeddingsStorePort.getByJobId(jobId);
    if (!status) {
        return { job_id: jobId, status: 'not_started', message: 'No embedding has been requested for this job' };
    }

    return {
        job_id: jobId,
        status: status.status,
        error_message: status.error_message,
        created_at: status.created_at,
        processed_at: status.processed_at
    };
};
