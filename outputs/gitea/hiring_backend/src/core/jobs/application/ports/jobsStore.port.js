module.exports = Object.freeze({
    portName: 'JobsStorePort',
    methods: Object.freeze([
        'getJobs',
        'getJobsAdmin',
        'getJobById',
        'getJobDetail',
        'getJobDetailAdmin',
        'saveJob',
        'deleteJob',
        'withTransaction',
        'ensureAuthorizedPersonMembership'
    ])
});
