const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({
    db,
    ACCESS_LEVELS,
    addWorkflowAclJoin,
    addOrganizationAclExists,
    addOrganizationAclClause
}) => {
    const getAllWorkflows = async (options = {}) => {
        const {
            page = 0,
            limit = 50,
            search,
            organizationId,
            isTemplate,
            actorUserId = null,
            minAccess = ACCESS_LEVELS.READ
        } = options;
        const offset = page * limit;

        const queryParams = [];
        const conditions = [];

        let fromSql = `
            FROM onboarding_workflows ow
            LEFT JOIN organizations o ON o.id = ow.organization_id
            LEFT JOIN users u ON u.id = ow.created_by
        `;

        if (actorUserId) {
            fromSql += `\n${addWorkflowAclJoin({
                params: queryParams,
                actorUserId,
                minAccess
            })}`;
        }

        if (search) {
            conditions.push(`(ow.name ILIKE $${queryParams.length + 1} OR ow.description ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }

        if (organizationId && organizationId !== 'all' && organizationId !== 'undefined' && organizationId !== 'null') {
            conditions.push(
                Array.isArray(organizationId)
                    ? `ow.organization_id = ANY($${queryParams.length + 1}::uuid[])`
                    : `ow.organization_id = $${queryParams.length + 1}`
            );
            queryParams.push(organizationId);
        }

        if (isTemplate !== undefined) {
            conditions.push(`ow.is_template = $${queryParams.length + 1}`);
            queryParams.push(isTemplate);
        }

        conditions.push('ow.is_active = true');
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;

        const countQuery = `
            SELECT COUNT(*) AS total
            ${fromSql}
            ${whereClause}
        `;
        const query = `
            SELECT ow.*, o.name AS organization_name, u.email AS created_by_email
            ${fromSql}
            ${whereClause}
            ORDER BY ow.created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        const [dataResult, countResult] = await Promise.all([
            db.query(query, [...queryParams, limit, offset]),
            db.query(countQuery, queryParams)
        ]);

        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].total, 10),
                totalPages: Math.ceil(countResult.rows[0].total / limit)
            }
        };
    };

    const getWorkflowById = async (id, options = {}) => {
        const params = [id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'ow',
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            });
        }

        const { rows } = await db.query(`
            SELECT ow.*, o.name AS organization_name, u.email AS created_by_email
            FROM onboarding_workflows ow
            LEFT JOIN organizations o ON o.id = ow.organization_id
            LEFT JOIN users u ON u.id = ow.created_by
            WHERE ow.id = $1
              AND ow.is_active = true
              ${aclClause}
        `, params);
        return rows[0] || null;
    };

    const getWorkflowWithSteps = async (id, options = {}) => {
        const workflow = await getWorkflowById(id, options);
        if (!workflow) return null;

        const params = [id];

        const aclClause = options.actorUserId
            ? addExistsClause(
                `    SELECT 1
                    FROM onboarding_workflows ow
                    WHERE ow.id = ws.workflow_id${addClause('AND', addOrganizationAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'ow',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            )
            : '';

        const { rows: steps } = await db.query(`
            SELECT
                os.*,
                ws.order_index AS workflow_order,
                array_agg(
                    CASE WHEN osd.document_id IS NOT NULL
                    THEN json_build_object(
                        'id', od.id,
                        'name', od.name,
                        'is_mandatory', osd.is_mandatory
                    ) END
                ) FILTER (WHERE osd.document_id IS NOT NULL) AS documents
            FROM workflow_steps ws
            JOIN onboarding_steps os ON os.id = ws.onboarding_step_id
            LEFT JOIN onboarding_step_documents osd ON osd.onboarding_step_id = os.id
            LEFT JOIN onboarding_documents od ON od.id = osd.document_id
            WHERE ws.workflow_id = $1
            ${aclClause}
            GROUP BY os.id, ws.order_index
            ORDER BY ws.order_index
        `, params);

        return {
            ...workflow,
            steps
        };
    };

    const createWorkflow = async (data, options = {}) => {
        const executor = options.client || db;
        const { name, description, organization_id, is_template = false, created_by } = data;

        const { rows } = await executor.query(
            `INSERT INTO onboarding_workflows
             (id, name, description, organization_id, is_template, is_active, created_by, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, true, $5, now(), now())
             RETURNING *`,
            [name, description, organization_id, is_template, created_by]
        );
        return rows[0];
    };

    const updateWorkflow = async (id, data, options = {}) => {
        const params = [data.name, data.description, data.organization_id, data.is_template, id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'ow',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            });
        }

        const { rows } = await db.query(
            `UPDATE onboarding_workflows ow
             SET name = $1, description = $2, organization_id = $3, is_template = $4, updated_at = now()
             WHERE ow.id = $5
               AND ow.is_active = true
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const deleteWorkflow = async (id, options = {}) => {
        const params = [id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'ow',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            });
        }

        const { rows } = await db.query(
            `UPDATE onboarding_workflows ow
             SET is_active = false, updated_at = now()
             WHERE ow.id = $1
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        getAllWorkflows,
        getWorkflowById,
        getWorkflowWithSteps,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow
    };
};
