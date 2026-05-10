const {
    ACCESS_LEVELS,
    RESOURCE_TYPES,
    addPermissionJoin,
    addRelationPermissionExists
} = require('@shared/authz/rebacSql');

const getExecutor = (db, options = {}) => options.client || db;

const addInterviewPermissionJoin = ({
    params,
    actorUserId,
    minAccess = ACCESS_LEVELS.READ,
    applicantAlias = 'a',
    joinAlias = 'rp_interview_acl'
}) => addPermissionJoin({
    params,
    actorUserId,
    resourceType: RESOURCE_TYPES.JOB_POSTING,
    resourceAlias: applicantAlias,
    resourceIdColumn: 'job_posting_id',
    minAccess,
    joinAlias
});

const addInterviewPermissionExists = ({
    params,
    actorUserId,
    minAccess = ACCESS_LEVELS.READ,
    interviewAlias = 'ie'
}) => addRelationPermissionExists({
    params,
    actorUserId,
    resourceType: RESOURCE_TYPES.JOB_POSTING,
    minAccess,
    relationSql: `EXISTS (
        SELECT 1
        FROM applicants a
        WHERE a.id = ${interviewAlias}.applicant_id
          AND a.job_posting_id = rp_acl.resource_id
    )`
});

module.exports = {
    getExecutor,
    ACCESS_LEVELS,
    addInterviewPermissionJoin,
    addInterviewPermissionExists
};
