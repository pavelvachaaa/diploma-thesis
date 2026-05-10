const RESOURCE_TYPES = Object.freeze({
    ORGANIZATION: 'organization',
    JOB_POSTING: 'job_posting'
});

const ACCESS_LEVELS = Object.freeze({
    READ: 'read',
    WRITE: 'write',
    ADMIN: 'admin'
});

const appendParam = (params, value, cast = '') => {
    params.push(value);
    return `$${params.length}${cast}`;
};

const normalizeClausePrefix = (prefix = 'AND') => {
    const normalized = String(prefix || '').trim().toUpperCase();
    if (normalized === 'WHERE') {
        return 'WHERE';
    }

    return 'AND';
};

const addClause = (prefix, predicate) => {
    const clausePrefix = normalizeClausePrefix(prefix);
    return ` ${clausePrefix} ${predicate}`;
};

const addExistsClause = (selectSql, prefix = 'AND') => {
    if (!selectSql || typeof selectSql !== 'string') {
        throw new Error('selectSql is required for addExistsClause');
    }

    return addClause(prefix, `EXISTS (\n${selectSql}\n    )`);
};

const buildDeniedJoin = (joinAlias = 'rp_acl') => (
    `INNER JOIN (
        SELECT NULL::uuid AS resource_id
        WHERE FALSE
    ) ${joinAlias} ON TRUE`
);

const normalizeAccessLevel = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (Object.values(ACCESS_LEVELS).includes(normalized)) {
        return normalized;
    }
    return ACCESS_LEVELS.READ;
};

const normalizeResourceType = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (Object.values(RESOURCE_TYPES).includes(normalized)) {
        return normalized;
    }
    throw new Error(`Unsupported ReBAC resource type: ${value}`);
};

const addPermissionJoin = ({
    params,
    actorUserId,
    resourceType,
    resourceAlias,
    resourceIdColumn = 'id',
    minAccess = ACCESS_LEVELS.READ,
    joinAlias = 'rp_acl'
}) => {
    if (!actorUserId) {
        return buildDeniedJoin(joinAlias);
    }

    const actorParam = appendParam(params, actorUserId);
    const resourceTypeParam = appendParam(params, normalizeResourceType(resourceType));
    const accessParam = appendParam(params, normalizeAccessLevel(minAccess), '::resource_access_level');

    return `INNER JOIN (
        SELECT DISTINCT resource_id
        FROM resource_permissions
        WHERE user_id = ${actorParam}
          AND resource_type = ${resourceTypeParam}
          AND access_level >= ${accessParam}
    ) ${joinAlias} ON ${joinAlias}.resource_id = ${resourceAlias}.${resourceIdColumn}`;
};

const addPermissionClause = ({ prefix = 'AND', ...options }) => (
    addClause(prefix, addPermissionExists(options))
);

const addPermissionExists = ({
    params,
    actorUserId,
    resourceType,
    resourceAlias,
    resourceIdColumn = 'id',
    minAccess = ACCESS_LEVELS.READ,
    permissionsAlias = 'rp_acl'
}) => {
    if (!actorUserId) {
        return 'FALSE';
    }

    const actorParam = appendParam(params, actorUserId);
    const resourceTypeParam = appendParam(params, normalizeResourceType(resourceType));
    const accessParam = appendParam(params, normalizeAccessLevel(minAccess), '::resource_access_level');

    return `EXISTS (
        SELECT 1
        FROM resource_permissions ${permissionsAlias}
        WHERE ${permissionsAlias}.user_id = ${actorParam}
          AND ${permissionsAlias}.resource_type = ${resourceTypeParam}
          AND ${permissionsAlias}.resource_id = ${resourceAlias}.${resourceIdColumn}
          AND ${permissionsAlias}.access_level >= ${accessParam}
    )`;
};

const addRelationPermissionClause = ({ prefix = 'AND', ...options }) => (
    addClause(prefix, addRelationPermissionExists(options))
);

const addRelationPermissionExists = ({
    params,
    actorUserId,
    resourceType,
    minAccess = ACCESS_LEVELS.READ,
    relationSql,
    permissionsAlias = 'rp_acl'
}) => {
    if (!actorUserId) {
        return 'FALSE';
    }

    if (!relationSql || typeof relationSql !== 'string') {
        throw new Error('relationSql is required for addRelationPermissionExists');
    }

    const actorParam = appendParam(params, actorUserId);
    const resourceTypeParam = appendParam(params, normalizeResourceType(resourceType));
    const accessParam = appendParam(params, normalizeAccessLevel(minAccess), '::resource_access_level');

    return `EXISTS (
        SELECT 1
        FROM resource_permissions ${permissionsAlias}
        WHERE ${permissionsAlias}.user_id = ${actorParam}
          AND ${permissionsAlias}.resource_type = ${resourceTypeParam}
          AND ${permissionsAlias}.access_level >= ${accessParam}
          AND (${relationSql})
    )`;
};

const addAnyPermissionClause = ({ prefix = 'AND', ...options }) => (
    addClause(prefix, addAnyPermissionExists(options))
);

const addAnyPermissionExists = ({
    params,
    actorUserId,
    resourceType,
    minAccess = ACCESS_LEVELS.READ,
    permissionsAlias = 'rp_acl'
}) => {
    if (!actorUserId) {
        return 'FALSE';
    }

    const actorParam = appendParam(params, actorUserId);
    const resourceTypeParam = appendParam(params, normalizeResourceType(resourceType));
    const accessParam = appendParam(params, normalizeAccessLevel(minAccess), '::resource_access_level');

    return `EXISTS (
        SELECT 1
        FROM resource_permissions ${permissionsAlias}
        WHERE ${permissionsAlias}.user_id = ${actorParam}
          AND ${permissionsAlias}.resource_type = ${resourceTypeParam}
          AND ${permissionsAlias}.access_level >= ${accessParam}
    )`;
};

module.exports = {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addClause,
    addExistsClause,
    addPermissionJoin,
    addPermissionClause,
    addPermissionExists,
    addRelationPermissionClause,
    addRelationPermissionExists,
    addAnyPermissionClause,
    addAnyPermissionExists
};
