module.exports = ({
    db,
    ACCESS_LEVELS,
    addOrganizationAcl,
    addOrganizationAclClause,
    buildDocumentAccessCondition,
    addExistsClause,
    addClause
}) => {
    const getWorkflowDocuments = async (workflowId, options = {}) => {
        const params = [workflowId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_workflows ow
                    WHERE ow.id = wd.workflow_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'ow',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const { rows } = await db.query(`
            SELECT wd.*,
                   od.name,
                   od.description,
                   tf.original_filename AS file_name,
                   tf.object_key AS file_path,
                   tf.mime_type,
                   tf.size_bytes AS file_size,
                   tf.bucket AS file_bucket,
                   od.status,
                   od.is_template,
                   CASE
                       WHEN tf.object_key IS NOT NULL
                       THEN CONCAT('/api/v1/documents/', od.id, '/download')
                       ELSE NULL
                   END AS download_url
            FROM workflow_documents wd
            JOIN onboarding_documents od ON od.id = wd.document_id
            LEFT JOIN files tf ON tf.id = od.template_file_id
            WHERE wd.workflow_id = $1
            ${aclClause}
            ORDER BY wd.order_index, od.name
        `, params);

        return rows;
    };

    const attachDocumentToWorkflow = async (workflowId, documentId, isMandatory, orderIndex, options = {}) => {
        const executor = options.client || db;
        const params = [workflowId, documentId, isMandatory, orderIndex];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = `${addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'ow',
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
                OR od.organization_id = ow.organization_id
              )`;
        }

        const { rows } = await executor.query(`
            INSERT INTO workflow_documents (id, workflow_id, document_id, is_mandatory, order_index)
            SELECT gen_random_uuid(), ow.id, od.id, $3, $4
            FROM onboarding_workflows ow
            JOIN onboarding_documents od ON od.id = $2
            WHERE ow.id = $1
            ${aclClause}
            RETURNING *
        `, params);

        return rows[0] || null;
    };

    const updateWorkflowDocumentAttachment = async (workflowId, documentId, updateData, options = {}) => {
        const executor = options.client || db;
        const fields = Object.keys(updateData).filter((field) => updateData[field] !== undefined);
        if (fields.length === 0) {
            return null;
        }

        const values = Object.values(updateData).filter((value) => value !== undefined);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        values.push(workflowId, documentId);

        let aclClause = '';
        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_workflows ow
                    WHERE ow.id = wd.workflow_id${addClause('AND', addOrganizationAcl({
                        params: values,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'ow',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(`
            UPDATE workflow_documents wd
            SET ${setClause}
            WHERE wd.workflow_id = $${fields.length + 1}
              AND wd.document_id = $${fields.length + 2}
              ${aclClause}
            RETURNING *
        `, values);

        return rows[0] || null;
    };

    const removeDocumentFromWorkflow = async (workflowId, documentId, options = {}) => {
        const executor = options.client || db;
        const params = [workflowId, documentId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_workflows ow
                    WHERE ow.id = wd.workflow_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'ow',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(
            `DELETE FROM workflow_documents wd
             WHERE wd.workflow_id = $1
               AND wd.document_id = $2
               ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        getWorkflowDocuments,
        attachDocumentToWorkflow,
        updateWorkflowDocumentAttachment,
        removeDocumentFromWorkflow
    };
};
