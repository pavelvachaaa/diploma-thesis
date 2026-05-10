module.exports = ({ jobsStorePort }) => async (options) => {
    return jobsStorePort.getJobs(options);
};
