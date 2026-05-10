const createJobSeeker = require('./createJobSeeker');
const deleteJobSeeker = require('./deleteJobSeeker');
const JobSeekerQuery = require('@core/jobSeekers/domain/JobSeekerQuery');

module.exports = ({
    jobSeekersStorePort,
    jobSeekersFilePort,
    jobSeekersFileGcPort,
    jobSeekersOrganizationLookupPort,
    cvIntentPort,
    logger
}) => ({
    createJobSeeker: createJobSeeker({
        jobSeekersStorePort,
        jobSeekersFilePort,
        jobSeekersFileGcPort,
        jobSeekersOrganizationLookupPort,
        cvIntentPort,
        logger
    }),
    getAllJobSeekers: (options = {}) => jobSeekersStorePort.getAllJobSeekers(
        JobSeekerQuery.normalizeListOptions(options)
    ),
    getJobSeekerById: (id, options = {}) => jobSeekersStorePort.getJobSeekerById(id, options),
    deleteJobSeeker: deleteJobSeeker({
        jobSeekersStorePort,
        jobSeekersFilePort,
        jobSeekersFileGcPort,
        logger
    }),
    getJobSeekersByOrganization: (organizationId, options = {}) =>
        jobSeekersStorePort.getJobSeekersByOrganization(organizationId, options),
    getAttachmentsByJobSeekerId: (jobSeekerId, options = {}) =>
        jobSeekersStorePort.getAttachmentsByJobSeekerId(jobSeekerId, options),
    getAttachmentById: (jobSeekerId, attachmentId, options = {}) =>
        jobSeekersStorePort.getAttachmentById(jobSeekerId, attachmentId, options)
});
