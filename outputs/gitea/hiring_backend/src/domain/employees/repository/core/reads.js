const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionJoin,
    addPermissionExists,
    addExistsClause,
    addClause
} = require('@shared/authz/rebacSql');

module.exports = ({ db, getExecutor }) => {
    const addEmployeeAclJoin = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.READ,
        joinAlias = 'rp_acl'
    }) => addPermissionJoin({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias: 'u',
        resourceIdColumn: 'organization_id',
        minAccess,
        joinAlias
    });

    const addEmployeeAclExists = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.READ,
        resourceAlias = 'u'
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias,
        resourceIdColumn: 'organization_id',
        minAccess
    });

    const getAllEmployees = async (options = {}) => {
        const {
            page = 1,
            limit = 10,
            organizationId = null,
            search = '',
            role = '',
            excludeRole = '',
            organizationName = '',
            actorUserId = null,
            minAccess = ACCESS_LEVELS.READ
        } = options;
        const offset = (page - 1) * limit;

        const queryParams = [];
        const whereConditions = [];

        let fromSql = `
            FROM users u
            LEFT JOIN user_roles ur ON ur.id = u.role_id
            LEFT JOIN organizations o ON u.organization_id = o.id
        `;

        if (actorUserId) {
            fromSql += `\n${addEmployeeAclJoin({
                params: queryParams,
                actorUserId,
                minAccess
            })}`;
        }

        if (organizationId !== null && organizationId !== undefined) {
            if (Array.isArray(organizationId)) {
                whereConditions.push(`u.organization_id = ANY($${queryParams.length + 1}::uuid[])`);
            } else {
                whereConditions.push(`u.organization_id = $${queryParams.length + 1}`);
            }
            queryParams.push(organizationId);
        }

        if (search) {
            whereConditions.push(`(
                LOWER(u.name || ' ' || u.surname) LIKE LOWER($${queryParams.length + 1}) OR
                LOWER(u.email) LIKE LOWER($${queryParams.length + 1})
            )`);
            queryParams.push(`%${search}%`);
        }

        if (role) {
            whereConditions.push(`ur.name = $${queryParams.length + 1}`);
            queryParams.push(role);
        }

        if (excludeRole) {
            whereConditions.push(`(ur.name IS NULL OR ur.name <> $${queryParams.length + 1})`);
            queryParams.push(excludeRole);
        }

        if (organizationName) {
            whereConditions.push(`LOWER(o.name) LIKE LOWER($${queryParams.length + 1})`);
            queryParams.push(`%${organizationName}%`);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countSql = `
            SELECT COUNT(DISTINCT u.id) AS total
            ${fromSql}
            ${whereClause}
        `;
        const countResult = await db.query(countSql, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);

        const dataSql = `
            SELECT DISTINCT
                u.id,
                u.email,
                u.name,
                u.surname,
                u.phone,
                u.is_active,
                u.applicant_id,
                u.organization_id,
                u.created_at,
                o.name AS organization_name,
                ur.name AS role_name,
                ur.description AS role_description
            ${fromSql}
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        const { rows } = await db.query(dataSql, [...queryParams, limit, offset]);

        return {
            data: rows,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    };

    const getEmployeeById = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = ` AND ${addEmployeeAclExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const sql = `
            SELECT
                u.id,
                u.email,
                u.name,
                u.surname,
                u.phone,
                u.is_active,
                u.applicant_id,
                u.organization_id,
                u.created_at,
                o.name AS organization_name,
                ur.name AS role_name,
                ur.description AS role_description
            FROM users u
            LEFT JOIN user_roles ur ON ur.id = u.role_id
            LEFT JOIN organizations o ON o.id = u.organization_id
            WHERE u.id = $1
            ${aclExists}
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0] || null;
    };

    const getAllRoles = async (options = {}) => {
        const executor = getExecutor(options);
        const sql = 'SELECT name, description FROM user_roles ORDER BY name';
        const { rows } = await executor.query(sql);
        return rows;
    };

    const getWorkflowById = async (workflowId, options = {}) => {
        const executor = getExecutor(options);
        const params = [workflowId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = ` AND ${addPermissionExists({
                params,
                actorUserId: options.actorUserId,
                resourceType: RESOURCE_TYPES.ORGANIZATION,
                resourceAlias: 'ow',
                resourceIdColumn: 'organization_id',
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const { rows } = await executor.query(
            `SELECT *
             FROM onboarding_workflows ow
             WHERE ow.id = $1
               AND ow.is_active = true
               ${aclExists}`,
            params
        );

        return rows[0] || null;
    };

    const getEmployeeDocuments = async (employeeId, options = {}) => {
        const executor = getExecutor(options);
        const params = [employeeId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = ` AND ${addEmployeeAclExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const query = `
            SELECT
                ud.id,
                u.id AS user_id,
                od.id AS document_id,
                uf.object_key AS file_path,
                uf.original_filename AS filename,
                uf.original_filename,
                uf.mime_type,
                uf.size_bytes AS file_size,
                uf.bucket AS file_bucket,
                ud.uploaded_at,
                ud.reviewed_by,
                ud.reviewed_at,
                ud.review_notes,
                COALESCE(ud.status, 'pending') AS status,
                od.name AS document_name,
                od.description,
                dt.name AS document_type,
                COALESCE(wd.is_mandatory, od.required) AS required,
                COALESCE(uf.original_filename, od.name) AS original_name
            FROM users u
            JOIN workflow_documents wd ON wd.workflow_id = u.onboarding_workflow_id
            JOIN onboarding_documents od ON od.id = wd.document_id
            LEFT JOIN user_documents ud ON ud.document_id = od.id AND ud.user_id = u.id
            LEFT JOIN files uf ON uf.id = ud.file_id
            LEFT JOIN document_types dt ON od.type_id = dt.id
            WHERE u.id = $1
            ${aclExists}
            ORDER BY COALESCE(wd.is_mandatory, od.required) DESC, od.name ASC
        `;

        const result = await executor.query(query, params);
        return result.rows;
    };

    const getDocumentForDownload = async (employeeId, documentId, options = {}) => {
        const executor = getExecutor(options);
        const params = [employeeId, documentId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM users u
                    WHERE u.id = ud.user_id${addClause('AND', addEmployeeAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const query = `
            SELECT
                uf.object_key AS file_path,
                uf.bucket AS file_bucket,
                ud.uploaded_at,
                od.name AS document_name,
                tf.original_filename AS template_name,
                CASE
                    WHEN uf.object_key IS NOT NULL THEN
                        COALESCE(uf.original_filename, od.name, 'document')
                    ELSE COALESCE(od.name, 'document')
                END AS original_name,
                COALESCE(uf.mime_type, 'application/octet-stream') AS mime_type
            FROM user_documents ud
            JOIN onboarding_documents od ON ud.document_id = od.id
            LEFT JOIN files uf ON uf.id = ud.file_id
            LEFT JOIN files tf ON tf.id = od.template_file_id
            WHERE ud.user_id = $1
              AND ud.document_id = $2
              AND ud.file_id IS NOT NULL
              ${aclExists}
        `;

        const result = await executor.query(query, params);
        return result.rows[0] || null;
    };

    return {
        getAllEmployees,
        getEmployeeById,
        getAllRoles,
        getWorkflowById,
        getEmployeeDocuments,
        getDocumentForDownload
    };
};
