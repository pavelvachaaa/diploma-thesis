const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists,
    addPermissionClause,
    addExistsClause,
    addClause
} = require('@shared/authz/rebacSql');

const createJobRoleAssignments = require('./jobRoleAssignments');
const createWorkflowAssignments = require('./workflowAssignments');
const createStepAssignments = require('./stepAssignments');

module.exports = ({
    db,
    withTransaction,
    DOCUMENT_SELECT_FIELDS,
    buildDocumentAccessCondition
}) => {
    const addOrganizationAcl = ({
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

    const shared = {
        db,
        withTransaction,
        DOCUMENT_SELECT_FIELDS,
        buildDocumentAccessCondition,
        ACCESS_LEVELS,
        addOrganizationAcl,
        addOrganizationAclClause,
        addExistsClause,
        addClause
    };

    return {
        ...createJobRoleAssignments(shared),
        ...createWorkflowAssignments(shared),
        ...createStepAssignments(shared)
    };
};
