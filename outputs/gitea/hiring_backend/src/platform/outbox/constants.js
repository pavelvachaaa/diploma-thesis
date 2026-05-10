const EVENT_TYPES = {
    WELCOME_EMAIL: 'email.welcome.v1',
    RAW_EMAIL: 'email.raw.v1',
    ROLE_NOTIFICATION: 'notification.role.v1',
    USER_NOTIFICATION: 'notification.user.v1',
    CV_PUBLISH_APPLICANT: 'cv.publish.applicant.v1',
    CV_PUBLISH_JOB_SEEKER: 'cv.publish.job_seeker.v1',
    JOB_EMBEDDING_REQUESTED: 'job.embedding.requested.v1',
    FILE_GC_DELETE: 'file.gc.delete.v1',
    REBAC_USER_ROLE_SYNC: 'rebac.user_role.sync.v1',
    REBAC_MEMBERSHIP_SYNC: 'rebac.membership.sync.v1',
    REBAC_MEMBERSHIP_DELETE: 'rebac.membership.delete.v1',
    REBAC_JOB_POSTING_SYNC: 'rebac.job_posting.sync.v1',
    REBAC_ORGANIZATION_SYNC: 'rebac.organization.sync.v1'
};

module.exports = {
    EVENT_TYPES
};
