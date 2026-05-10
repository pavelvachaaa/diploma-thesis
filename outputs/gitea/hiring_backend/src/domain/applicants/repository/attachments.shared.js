const {
    ACCESS_LEVELS,
    RESOURCE_TYPES,
    addPermissionJoin,
    addPermissionExists
} = require('@shared/authz/rebacSql');

module.exports = ({ db }) => {
    const getExecutor = (options = {}) => options.client || db;

    const buildAttachmentPermissionJoin = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.READ,
        joinAlias = 'rp_attachment_acl'
    }) => addPermissionJoin({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.JOB_POSTING,
        resourceAlias: 'a',
        resourceIdColumn: 'job_posting_id',
        minAccess,
        joinAlias
    });

    const buildAttachmentPermissionExists = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.WRITE
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.JOB_POSTING,
        resourceAlias: 'a',
        resourceIdColumn: 'job_posting_id',
        minAccess
    });

    return {
        ACCESS_LEVELS,
        getExecutor,
        buildAttachmentPermissionJoin,
        buildAttachmentPermissionExists
    };
};
