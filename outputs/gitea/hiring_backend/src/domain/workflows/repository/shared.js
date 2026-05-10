const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionJoin,
    addPermissionExists,
    addPermissionClause
} = require('@shared/authz/rebacSql');

module.exports = () => {
    const addWorkflowAclJoin = ({ params, actorUserId, minAccess = ACCESS_LEVELS.READ }) => (
        addPermissionJoin({
            params,
            actorUserId,
            resourceType: RESOURCE_TYPES.ORGANIZATION,
            resourceAlias: 'ow',
            resourceIdColumn: 'organization_id',
            minAccess
        })
    );

    const addOrganizationAclExists = ({
        params,
        actorUserId,
        resourceAlias,
        minAccess = ACCESS_LEVELS.READ
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias,
        resourceIdColumn: 'organization_id',
        minAccess
    });

    const addOrganizationAclClause = ({
        params,
        actorUserId,
        resourceAlias,
        minAccess = ACCESS_LEVELS.READ,
        prefix = 'AND'
    }) => addPermissionClause({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias,
        resourceIdColumn: 'organization_id',
        minAccess,
        prefix
    });

    return {
        ACCESS_LEVELS,
        addWorkflowAclJoin,
        addOrganizationAclExists,
        addOrganizationAclClause
    };
};
