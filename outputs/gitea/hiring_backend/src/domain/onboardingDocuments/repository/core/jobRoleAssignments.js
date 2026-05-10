module.exports = ({
    db,
    DOCUMENT_SELECT_FIELDS,
    buildDocumentAccessCondition,
    ACCESS_LEVELS,
    addOrganizationAcl,
    addOrganizationAclClause,
    addExistsClause,
    addClause
}) => {
    const getDocumentsByJobRole = async (jobRoleId, options = {}) => {
        const params = [jobRoleId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM job_roles jr
                    WHERE jr.id = jrrd.job_role_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'jr',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const { rows } = await db.query(`
            SELECT
                ${DOCUMENT_SELECT_FIELDS},
                dt.name AS type_name,
                jrrd.is_mandatory
            FROM onboarding_documents od
            LEFT JOIN files tf ON tf.id = od.template_file_id
            LEFT JOIN document_types dt ON dt.id = od.type_id
            JOIN job_role_required_documents jrrd ON jrrd.document_id = od.id
            WHERE jrrd.job_role_id = $1
            ${aclClause}
            ORDER BY od.name
        `, params);
        return rows;
    };

    const assignToJobRole = async (jobRoleId, documentId, isMandatory = true, options = {}) => {
        const executor = options.client || db;
        const params = [jobRoleId, documentId, isMandatory];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = `${addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'jr',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}
              AND ${buildDocumentAccessCondition({
                  params,
                  actorUserId: options.actorUserId,
                  resourceAlias: 'od',
                  minAccess: options.minAccess || ACCESS_LEVELS.WRITE
              })}
              AND (
                od.applies_to_all_organizations = true
                OR od.organization_id = jr.organization_id
              )`;
        }

        const { rows } = await executor.query(
            `INSERT INTO job_role_required_documents (id, job_role_id, document_id, is_mandatory)
             SELECT gen_random_uuid(), jr.id, od.id, $3
             FROM job_roles jr
             JOIN onboarding_documents od ON od.id = $2
             WHERE jr.id = $1
             ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const updateJobRoleAssignment = async (jobRoleId, documentId, isMandatory, options = {}) => {
        const executor = options.client || db;
        const params = [jobRoleId, documentId, isMandatory];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM job_roles jr
                    WHERE jr.id = jrrd.job_role_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'jr',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(
            `UPDATE job_role_required_documents jrrd
             SET is_mandatory = $3
             WHERE jrrd.job_role_id = $1
               AND jrrd.document_id = $2
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const removeFromJobRole = async (jobRoleId, documentId, options = {}) => {
        const executor = options.client || db;
        const params = [jobRoleId, documentId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM job_roles jr
                    WHERE jr.id = jrrd.job_role_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'jr',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(
            `DELETE FROM job_role_required_documents jrrd
             WHERE jrrd.job_role_id = $1
               AND jrrd.document_id = $2
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        getDocumentsByJobRole,
        assignToJobRole,
        updateJobRoleAssignment,
        removeFromJobRole
    };
};
