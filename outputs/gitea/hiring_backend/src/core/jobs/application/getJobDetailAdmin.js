module.exports = ({ jobsStorePort, jobPermissionPort }) => async (jobId, options = {}) => {
    const job = await jobsStorePort.getJobDetailAdmin(jobId, options);
    if (!job) {
        return null;
    }

    return {
        ...job,
        authorized_people: await jobPermissionPort.getDirectJobAssignments(jobId)
    };
};
