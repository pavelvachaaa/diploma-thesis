const jobCreated = ({ createdJob, payload, userId }) => Object.freeze({
    type: 'job.created',
    createdJob,
    payload,
    userId: userId || null
});

const jobUpdated = ({ id, existingJob, updatedJob }) => Object.freeze({
    type: 'job.updated',
    id,
    existingJob,
    updatedJob
});

const jobDeleted = ({ id, existingJob, deletedJob }) => Object.freeze({
    type: 'job.deleted',
    id,
    existingJob,
    deletedJob
});

const jobDuplicated = ({ originalJob, newJob, userId }) => Object.freeze({
    type: 'job.duplicated',
    originalJob,
    newJob,
    userId: userId || null
});

module.exports = { jobCreated, jobUpdated, jobDeleted, jobDuplicated };
