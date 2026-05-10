module.exports = ({
    db,
    withTransaction,
    ACCESS_LEVELS,
    addOrganizationAcl,
    addOrganizationAclClause,
    buildDocumentAccessCondition,
    addExistsClause,
    addClause
}) => {
    const getStepDocuments = async (stepId, options = {}) => {
        const params = [stepId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_steps os
                    WHERE os.id = osd.onboarding_step_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'os',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const { rows } = await db.query(`
            SELECT osd.*,
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
            FROM onboarding_step_documents osd
            JOIN onboarding_documents od ON od.id = osd.document_id
            LEFT JOIN files tf ON tf.id = od.template_file_id
            WHERE osd.onboarding_step_id = $1
            ${aclClause}
            ORDER BY od.name
        `, params);

        return rows;
    };

    const attachDocumentToStep = async (stepId, documentId, isMandatory, options = {}) => {
        const executor = options.client || db;
        const params = [stepId, documentId, isMandatory];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = `${addOrganizationAclClause({
                params,
                actorUserId: options.actorUserId,
                resourceAlias: 'os',
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
                OR od.organization_id = os.organization_id
              )`;
        }

        const { rows } = await executor.query(`
            INSERT INTO onboarding_step_documents (id, onboarding_step_id, document_id, is_mandatory)
            SELECT gen_random_uuid(), os.id, od.id, $3
            FROM onboarding_steps os
            JOIN onboarding_documents od ON od.id = $2
            WHERE os.id = $1
            ${aclClause}
            ON CONFLICT (onboarding_step_id, document_id)
            DO UPDATE SET is_mandatory = EXCLUDED.is_mandatory
            RETURNING *
        `, params);

        return rows[0] || null;
    };

    const markDocumentAsRead = async (userId, stepId, documentId) => {
        return withTransaction(async (client) => {
            const { rows: currentRows } = await client.query(`
                SELECT form_response
                FROM user_onboarding_steps
                WHERE user_id = $1 AND onboarding_step_id = $2
            `, [userId, stepId]);

            if (currentRows.length === 0) {
                throw new Error('User onboarding step not found');
            }

            let formResponse = currentRows[0].form_response || {};
            if (typeof formResponse === 'string') {
                try {
                    formResponse = JSON.parse(formResponse);
                } catch (_error) {
                    formResponse = {};
                }
            }

            if (!formResponse.docReads) {
                formResponse.docReads = {};
            }
            formResponse.docReads[documentId] = new Date().toISOString();

            const { rows } = await client.query(`
                UPDATE user_onboarding_steps
                SET form_response = $1
                WHERE user_id = $2 AND onboarding_step_id = $3
                RETURNING *
            `, [JSON.stringify(formResponse), userId, stepId]);

            return {
                success: true,
                documentId,
                readAt: formResponse.docReads[documentId],
                userStep: rows[0]
            };
        }, { label: 'onboardingDocuments.markDocumentAsRead' });
    };

    const removeDocumentFromStep = async (stepId, documentId, options = {}) => {
        const executor = options.client || db;
        const params = [stepId, documentId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM onboarding_steps os
                    WHERE os.id = osd.onboarding_step_id${addClause('AND', addOrganizationAcl({
                        params,
                        actorUserId: options.actorUserId,
                        resourceAlias: 'os',
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(`
            DELETE FROM onboarding_step_documents osd
            WHERE osd.onboarding_step_id = $1
              AND osd.document_id = $2
              ${aclClause}
            RETURNING *
        `, params);

        if (rows.length === 0) {
            throw new Error('Document attachment not found');
        }

        return rows[0];
    };

    return {
        getStepDocuments,
        attachDocumentToStep,
        markDocumentAsRead,
        removeDocumentFromStep
    };
};
