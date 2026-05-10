const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists,
    addAnyPermissionExists
} = require('@shared/authz/rebacSql');

const DOCUMENT_SELECT_FIELDS = `
    od.*,
    tf.object_key AS file_path,
    tf.original_filename AS file_name,
    tf.mime_type,
    tf.size_bytes AS file_size,
    tf.bucket AS file_bucket
`;

const USER_DOCUMENT_SELECT_FIELDS = `
    ud.*,
    f.object_key AS file_path,
    f.original_filename AS original_filename,
    f.original_filename AS filename,
    f.mime_type AS mime_type,
    f.size_bytes AS file_size,
    f.bucket AS file_bucket
`;

const buildDocumentAccessCondition = ({
    params,
    actorUserId,
    resourceAlias = 'od',
    minAccess = ACCESS_LEVELS.READ
}) => {
    if (!actorUserId) {
        return '';
    }

    const scopedPermission = addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias,
        resourceIdColumn: 'organization_id',
        minAccess,
        permissionsAlias: 'rp_doc_scope'
    });

    const anyPermission = addAnyPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        minAccess,
        permissionsAlias: 'rp_doc_any'
    });

    return `(
        (${resourceAlias}.applies_to_all_organizations = true AND ${anyPermission})
        OR
        (COALESCE(${resourceAlias}.applies_to_all_organizations, false) = false AND ${scopedPermission})
    )`;
};

const buildDocumentFilters = ({
    search,
    organizationId,
    typeId,
    required,
    actorUserId = null,
    minAccess = ACCESS_LEVELS.READ
}) => {
    const queryParams = [];
    const conditions = [];

    const accessCondition = buildDocumentAccessCondition({
        params: queryParams,
        actorUserId,
        minAccess
    });
    if (accessCondition) {
        conditions.push(accessCondition);
    }

    if (search) {
        conditions.push(`(od.name ILIKE $${queryParams.length + 1} OR od.description ILIKE $${queryParams.length + 1})`);
        queryParams.push(`%${search}%`);
    }

    if (organizationId) {
        if (Array.isArray(organizationId)) {
            conditions.push(`(od.organization_id = ANY($${queryParams.length + 1}::uuid[]) OR od.applies_to_all_organizations = true)`);
            queryParams.push(organizationId);
        } else {
            conditions.push(`(od.organization_id = $${queryParams.length + 1} OR od.applies_to_all_organizations = true)`);
            queryParams.push(organizationId);
        }
    }

    if (typeId) {
        conditions.push(`od.type_id = $${queryParams.length + 1}`);
        queryParams.push(typeId);
    }

    if (required !== undefined) {
        conditions.push(`od.required = $${queryParams.length + 1}`);
        queryParams.push(required);
    }

    return {
        queryParams,
        whereClause: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''
    };
};

module.exports = {
    DOCUMENT_SELECT_FIELDS,
    USER_DOCUMENT_SELECT_FIELDS,
    buildDocumentFilters,
    buildDocumentAccessCondition,
    RESOURCE_TYPES,
    ACCESS_LEVELS
};
