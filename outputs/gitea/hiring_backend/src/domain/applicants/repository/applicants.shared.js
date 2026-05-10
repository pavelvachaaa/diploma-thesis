const {
    ACCESS_LEVELS,
    RESOURCE_TYPES,
    addPermissionJoin,
    addPermissionExists
} = require('@shared/authz/rebacSql');

module.exports = ({ db }) => {
    const getExecutor = (options = {}) => options.client || db;

    const buildApplicantPermissionJoin = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.READ,
        joinAlias = 'rp_job_acl'
    }) => addPermissionJoin({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.JOB_POSTING,
        resourceAlias: 'jp',
        resourceIdColumn: 'id',
        minAccess,
        joinAlias
    });

    const buildApplicantPermissionExists = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.READ,
        applicantAlias = 'a'
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.JOB_POSTING,
        resourceAlias: applicantAlias,
        resourceIdColumn: 'job_posting_id',
        minAccess
    });

    return {
        ACCESS_LEVELS,
        getExecutor,
        buildApplicantPermissionJoin,
        buildApplicantPermissionExists
    };
};
