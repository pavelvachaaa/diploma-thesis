const { jobDeleted } = require('../domain/events');

module.exports = ({ jobsStorePort, jobsAuditPort }) => async (id, actorUserId) => {
    const existing = await jobsStorePort.getJobDetailAdmin(id, {
        actorUserId,
        minAccess: 'write'
    });

    const deletedJob = await jobsStorePort.deleteJob(id, {
        actorUserId,
        minAccess: 'write'
    });

    if (deletedJob) {
        jobsAuditPort.recordJobDeleted({ id, existingJob: existing, deletedJob });
    }

    return deletedJob;
};
