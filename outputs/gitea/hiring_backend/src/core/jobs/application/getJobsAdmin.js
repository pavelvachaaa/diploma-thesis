module.exports = ({ jobsStorePort }) => async (options) => {
    return jobsStorePort.getJobsAdmin(options);
};
