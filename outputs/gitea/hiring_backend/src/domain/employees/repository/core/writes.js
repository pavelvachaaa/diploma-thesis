const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists,
    addExistsClause,
    addClause
} = require('@shared/authz/rebacSql');
const normalizeEmail = require('@shared/email/normalizeEmail');

module.exports = ({ db, runInTransaction }) => {
    const dedupeFiles = (rows = []) => {
        const byId = new Map();
        for (const row of rows) {
            if (!row?.id || byId.has(row.id)) {
                continue;
            }
            byId.set(row.id, row);
        }
        return [...byId.values()];
    };

    const getEmployeeDeleteFiles = async (userId, client) => {
        const [documentFilesResult, chatFilesResult] = await Promise.all([
            client.query(
                `SELECT DISTINCT
                    f.id,
                    f.bucket,
                    f.object_key,
                    f.organization_id
                 FROM user_documents ud
                 JOIN files f ON f.id = ud.file_id
                 WHERE ud.user_id = $1
                   AND ud.file_id IS NOT NULL`,
                [userId]
            ),
            client.query(
                `SELECT DISTINCT
                    f.id,
                    f.bucket,
                    f.object_key,
                    f.organization_id
                 FROM direct_messages dm
                 JOIN direct_message_attachments dma ON dma.message_id = dm.id
                 JOIN files f ON f.id = dma.file_id
                 WHERE (dm.sender_id = $1 OR dm.recipient_id = $1)
                   AND dma.file_id IS NOT NULL`,
                [userId]
            )
        ]);

        return dedupeFiles([
            ...(documentFilesResult.rows || []),
            ...(chatFilesResult.rows || [])
        ]);
    };

    const updateEmployeeRole = async (userId, newRoleName, hooks = {}) => {
        return runInTransaction(async (client) => {
            const roleResult = await client.query('SELECT id FROM user_roles WHERE name = $1', [newRoleName]);

            if (roleResult.rows.length === 0) {
                throw new Error(`Role '${newRoleName}' not found`);
            }

            const newRoleId = roleResult.rows[0].id;

            const result = await client.query(
                `UPDATE users
                 SET role_id = $1
                 WHERE id = $2
                 RETURNING *`,
                [newRoleId, userId]
            );

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = result.rows[0];

            if (typeof hooks.onBeforeCommit === 'function') {
                await hooks.onBeforeCommit({
                    client,
                    user
                });
            }

            return user;
        }, { label: 'employees.updateRole' });
    };

    const createEmployeeFromApplicant = async (
        applicantId,
        workflowId,
        startDate,
        notes,
        passwordHash,
        hooks = {}
    ) => {
        return runInTransaction(async (client) => {
            const applicantResult = await client.query(
                'SELECT * FROM applicants WHERE id = $1',
                [applicantId]
            );

            if (applicantResult.rows.length === 0) {
                throw new Error('Applicant not found');
            }

            const applicant = applicantResult.rows[0];
            const roleResult = await client.query(
                'SELECT id FROM user_roles WHERE name = $1',
                ['user']
            );

            if (roleResult.rows.length === 0) {
                throw new Error('User role not found');
            }

            const userResult = await client.query(
                `INSERT INTO users (
                    id, applicant_id, email, name, surname, phone,
                    password_hash, is_active, onboarding_workflow_id, organization_id, role_id, created_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                ) RETURNING *`,
                [
                    applicantId,
                    normalizeEmail(applicant.email),
                    applicant.name,
                    applicant.surname,
                    applicant.phone,
                    passwordHash,
                    true,
                    workflowId,
                    applicant.organization_id,
                    roleResult.rows[0].id,
                    new Date()
                ]
            );

            const newUser = userResult.rows[0];

            const membershipResult = await client.query(
                `INSERT INTO organization_memberships (
                    id, user_id, organization_id, assigned_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3
                )
                RETURNING *`,
                [
                    newUser.id,
                    applicant.organization_id,
                    new Date()
                ]
            );
            const membership = membershipResult.rows[0];

            const workflowStepsResult = await client.query(
                `SELECT os.*
                 FROM onboarding_steps os
                 JOIN workflow_steps ws ON os.id = ws.onboarding_step_id
                 WHERE ws.workflow_id = $1
                 ORDER BY ws.order_index`,
                [workflowId]
            );

            for (const step of workflowStepsResult.rows) {
                await client.query(
                    `INSERT INTO user_onboarding_steps (
                        id, user_id, onboarding_step_id, status
                    ) VALUES (
                        gen_random_uuid(), $1, $2, 'not_started'
                    )`,
                    [newUser.id, step.id]
                );
            }

            if (typeof hooks.onBeforeCommit === 'function') {
                await hooks.onBeforeCommit({
                    client,
                    newUser,
                    membership,
                    applicant,
                    context: {
                        applicantId,
                        workflowId,
                        startDate,
                        notes
                    }
                });
            }

            return newUser;
        }, { label: 'employees.createFromApplicant' });
    };

    const updateDocumentStatus = async (employeeId, documentId, status, notes = null, hooks = {}, options = {}) => {
        const updated = await runInTransaction(async (client) => {
            const params = [status, employeeId, documentId];
            let aclExists = '';

            if (options.actorUserId) {
                aclExists = addExistsClause(
                    `    SELECT 1
                        FROM users u
                        WHERE u.id = ud.user_id${addClause('AND', addPermissionExists({
                            params,
                            actorUserId: options.actorUserId,
                            resourceType: RESOURCE_TYPES.ORGANIZATION,
                            resourceAlias: 'u',
                            resourceIdColumn: 'organization_id',
                            minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                        }))}`
                );
            }

            const updateResult = await client.query(
                `UPDATE user_documents ud
                 SET status = $1
                 WHERE ud.user_id = $2
                   AND ud.document_id = $3
                   ${aclExists}
                 RETURNING *`,
                params
            );

            if (updateResult.rows.length === 0) {
                return null;
            }

            if (typeof hooks.onBeforeCommit === 'function') {
                await hooks.onBeforeCommit({
                    client,
                    employeeId,
                    documentId,
                    status,
                    notes,
                    document: updateResult.rows[0]
                });
            }

            return updateResult.rows[0] || null;
        }, { label: 'employees.updateDocumentStatus' });

        if (!updated) {
            return null;
        }

        const params = [employeeId, documentId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM users u
                    WHERE u.id = ud.user_id${addClause('AND', addPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceType: RESOURCE_TYPES.ORGANIZATION,
                        resourceAlias: 'u',
                        resourceIdColumn: 'organization_id',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const result = await db.query(
            `SELECT
                ud.id,
                ud.user_id,
                ud.document_id,
                uf.object_key as file_path,
                uf.bucket as file_bucket,
                ud.uploaded_at,
                ud.status,
                od.name as document_name,
                od.description,
                dt.name as document_type,
                CASE
                    WHEN uf.object_key IS NOT NULL THEN
                        COALESCE(
                            uf.original_filename,
                            od.name
                        )
                    ELSE od.name
                END as original_name
             FROM user_documents ud
             JOIN onboarding_documents od ON ud.document_id = od.id
             LEFT JOIN files uf ON uf.id = ud.file_id
             LEFT JOIN document_types dt ON od.type_id = dt.id
             WHERE ud.user_id = $1
               AND ud.document_id = $2
               ${aclExists}`,
            params
        );

        return result.rows[0] || null;
    };

    const deleteEmployeeFully = async (userId, hooks = {}, options = {}) => {
        return runInTransaction(async (client) => {
            const actorUserId = options.deletedByUserId || null;
            const employeeResult = await client.query(
                `SELECT
                    u.*,
                    ur.name AS role_name,
                    ur.description AS role_description,
                    o.name AS organization_name
                 FROM users u
                 LEFT JOIN user_roles ur ON ur.id = u.role_id
                 LEFT JOIN organizations o ON o.id = u.organization_id
                 WHERE u.id = $1
                 LIMIT 1`,
                [userId]
            );

            if (employeeResult.rows.length === 0) {
                return null;
            }

            const employee = employeeResult.rows[0];
            const fileRefs = await getEmployeeDeleteFiles(userId, client);

            await client.query(
                `UPDATE applicant_status_history
                 SET changed_by = NULL
                 WHERE changed_by = $1`,
                [userId]
            );

            await client.query(
                `UPDATE organization_memberships
                 SET assigned_by = NULL
                 WHERE assigned_by = $1`,
                [userId]
            );

            await client.query(
                `UPDATE application_attachments
                 SET reviewed_by = NULL
                 WHERE reviewed_by = $1`,
                [userId]
            );

            await client.query(
                `UPDATE user_documents
                 SET reviewed_by = NULL
                 WHERE reviewed_by = $1`,
                [userId]
            );

            if (actorUserId) {
                await client.query(
                    `UPDATE interview_events
                     SET created_by = $2
                     WHERE created_by = $1`,
                    [userId, actorUserId]
                );
            }

            await client.query(
                `DELETE FROM direct_messages
                 WHERE sender_id = $1
                    OR recipient_id = $1`,
                [userId]
            );

            const deletedResult = await client.query(
                `DELETE FROM users
                 WHERE id = $1
                 RETURNING *`,
                [userId]
            );

            const deletedEmployee = deletedResult.rows[0] || null;

            if (!deletedEmployee) {
                return null;
            }

            if (typeof hooks.onBeforeCommit === 'function') {
                await hooks.onBeforeCommit({
                    client,
                    employee: deletedEmployee,
                    fileRefs
                });
            }

            return deletedEmployee;
        }, { label: 'employees.deleteFully' });
    };

    return {
        updateEmployeeRole,
        createEmployeeFromApplicant,
        updateDocumentStatus,
        deleteEmployeeFully
    };
};
