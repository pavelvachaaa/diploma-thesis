const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({
    db,
    ACCESS_LEVELS,
    addOrganizationAclExists,
    addOrganizationAclClause
}) => {
    const getJobRoleWorkflows = async (jobRoleId, options = {}) => {
        const params = [jobRoleId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM job_roles jr
                    WHERE jr.id = jrw.job_role_id${addClause('AND', addOrganizationAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'jr',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const { rows } = await db.query(`
            SELECT ow.*, jrw.is_active AS assignment_active
            FROM job_role_workflows jrw
            JOIN onboarding_workflows ow ON ow.id = jrw.workflow_id
            WHERE jrw.job_role_id = $1
              AND jrw.is_active = true
              AND ow.is_active = true
              ${aclClause}
            ORDER BY ow.name
        `, params);
        return rows;
    };

    const assignWorkflowToJobRole = async (jobRoleId, workflowId, options = {}) => {
        const params = [jobRoleId, workflowId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = `${addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'jr',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}
              AND ow.organization_id = jr.organization_id`;
        }

        const { rows } = await db.query(
            `INSERT INTO job_role_workflows (id, job_role_id, workflow_id, is_active, created_at, updated_at)
             SELECT gen_random_uuid(), jr.id, ow.id, true, now(), now()
             FROM job_roles jr
             JOIN onboarding_workflows ow ON ow.id = $2
             WHERE jr.id = $1
             ${aclClause}
             ON CONFLICT (job_role_id, workflow_id)
             DO UPDATE SET is_active = true, updated_at = now()
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const removeWorkflowFromJobRole = async (jobRoleId, workflowId, options = {}) => {
        const params = [jobRoleId, workflowId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM job_roles jr
                    WHERE jr.id = jrw.job_role_id${addClause('AND', addOrganizationAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'jr',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await db.query(
            `UPDATE job_role_workflows jrw
             SET is_active = false, updated_at = now()
             WHERE jrw.job_role_id = $1
               AND jrw.workflow_id = $2
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const getUserOnboardingProgress = async (userId, options = {}) => {
        const params = [userId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM users u
                    WHERE u.id = uop.user_id${addClause('AND', addOrganizationAclExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'u',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const { rows } = await db.query(`
            SELECT uop.*, ow.name AS workflow_name, ow.description AS workflow_description
            FROM user_onboarding_progress uop
            JOIN onboarding_workflows ow ON ow.id = uop.workflow_id
            WHERE uop.user_id = $1
            ${aclClause}
            ORDER BY uop.start_date DESC
        `, params);
        return rows;
    };

    const startUserOnboarding = async (data, options = {}) => {
        const { user_id, workflow_id, start_date, assigned_hr } = data;
        const params = [user_id, workflow_id, start_date, assigned_hr];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = `${addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'u',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}
              AND ow.organization_id = u.organization_id`;
        }

        const { rows } = await db.query(
            `INSERT INTO user_onboarding_progress
             (id, user_id, workflow_id, start_date, status, assigned_hr, created_at, updated_at)
             SELECT gen_random_uuid(), u.id, ow.id, $3, 'not_started', $4, now(), now()
             FROM users u
             JOIN onboarding_workflows ow ON ow.id = $2
             WHERE u.id = $1
             ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        getJobRoleWorkflows,
        assignWorkflowToJobRole,
        removeWorkflowFromJobRole,
        getUserOnboardingProgress,
        startUserOnboarding
    };
};
