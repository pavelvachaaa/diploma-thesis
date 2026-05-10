const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({
    db,
    ACCESS_LEVELS,
    addOrganizationAclExists,
    addOrganizationAclClause,
    getWorkflowById
}) => {
    const getWorkflowSteps = async (workflowId, options = {}) => {
        const workflow = await getWorkflowById(workflowId, options);
        if (!workflow) {
            return [];
        }

        const { rows } = await db.query(`
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
            GROUP BY os.id, ws.order_index
            ORDER BY ws.order_index
        `, [workflowId]);
        return rows;
    };

    const addStepToWorkflow = async (workflowId, stepId, orderIndex, options = {}) => {
        const executor = options.client || db;
        const params = [workflowId, stepId, orderIndex];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = `${addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'ow',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}
              AND os.organization_id = ow.organization_id`;
        }

        const { rows } = await executor.query(
            `INSERT INTO workflow_steps (id, workflow_id, onboarding_step_id, order_index)
             SELECT gen_random_uuid(), ow.id, os.id, $3
             FROM onboarding_workflows ow
             JOIN onboarding_steps os ON os.id = $2
             WHERE ow.id = $1
             ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const removeStepFromWorkflow = async (workflowId, stepId, options = {}) => {
        const params = [workflowId, stepId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_workflows ow
                    WHERE ow.id = ws.workflow_id${addClause('AND', addOrganizationAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'ow',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await db.query(
            `DELETE FROM workflow_steps ws
             WHERE ws.workflow_id = $1
               AND ws.onboarding_step_id = $2
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const updateStepOrder = async (workflowId, stepId, orderIndex, options = {}) => {
        const params = [workflowId, stepId, orderIndex];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_workflows ow
                    WHERE ow.id = ws.workflow_id${addClause('AND', addOrganizationAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'ow',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await db.query(
            `UPDATE workflow_steps ws
             SET order_index = $3
             WHERE ws.workflow_id = $1
               AND ws.onboarding_step_id = $2
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        getWorkflowSteps,
        addStepToWorkflow,
        removeStepFromWorkflow,
        updateStepOrder
    };
};
