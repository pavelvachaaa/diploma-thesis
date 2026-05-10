const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists,
    addExistsClause,
    addClause
} = require('@shared/authz/rebacSql');

module.exports = ({ db, getExecutor, USER_DOCUMENT_SELECT_FIELDS }) => {
    const getUserDocuments = async (userId, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                ${USER_DOCUMENT_SELECT_FIELDS},
                ud.uploaded_at,
                ud.status,
                ud.reviewed_by,
                ud.reviewed_at,
                ud.review_notes,
                od.name as document_name,
                od.description as document_description,
                od.required as is_required,
                ds.description as status_description,
                ds.color as status_color,
                u.name as reviewed_by_name,
                u.surname as reviewed_by_surname
            FROM user_documents ud
            JOIN onboarding_documents od ON ud.document_id = od.id
            LEFT JOIN files f ON f.id = ud.file_id
            LEFT JOIN document_statuses ds ON ud.status = ds.name
            LEFT JOIN users u ON ud.reviewed_by = u.id
            WHERE ud.user_id = $1
            ORDER BY od.name, ud.uploaded_at DESC
        `;

        const result = await executor.query(query, [userId]);
        return result.rows;
    };

    const getUserDocumentById = async (userId, userDocumentId, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                ${USER_DOCUMENT_SELECT_FIELDS},
                ud.uploaded_at,
                ud.status,
                ud.reviewed_by,
                ud.reviewed_at,
                ud.review_notes,
                od.name as document_name,
                od.description as document_description,
                od.required as is_required,
                ds.description as status_description,
                ds.color as status_color
            FROM user_documents ud
            JOIN onboarding_documents od ON ud.document_id = od.id
            LEFT JOIN files f ON f.id = ud.file_id
            LEFT JOIN document_statuses ds ON ud.status = ds.name
            WHERE ud.user_id = $1 AND ud.id = $2
        `;

        const result = await executor.query(query, [userId, userDocumentId]);
        return result.rows[0] || null;
    };

    const getUserOrganization = async (userId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0]?.organization_id || null;
    };

    const upsertUserDocument = async (userId, documentId, fileData, options = {}) => {
        const executor = getExecutor(options);
        const existing = await executor.query(
            'SELECT id, file_id FROM user_documents WHERE user_id = $1 AND document_id = $2',
            [userId, documentId]
        );

        let result;
        let oldFileId = null;

        if (existing.rows.length > 0) {
            oldFileId = existing.rows[0].file_id;
            result = await executor.query(
                `UPDATE user_documents
                 SET file_id = $3, uploaded_at = NOW(), status = 'pending'
                 WHERE user_id = $1 AND document_id = $2
                 RETURNING *`,
                [
                    userId,
                    documentId,
                    fileData.fileId
                ]
            );
        } else {
            result = await executor.query(
                `INSERT INTO user_documents (id, user_id, document_id, file_id, uploaded_at, status)
                 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), 'pending')
                 RETURNING *`,
                [
                    userId,
                    documentId,
                    fileData.fileId
                ]
            );
        }

        return {
            document: result.rows[0],
            oldFileId
        };
    };

    const updateUserDocumentStatus = async (userDocumentId, statusData, options = {}) => {
        const executor = getExecutor(options);
        const { status, reviewed_by, review_notes } = statusData;
        const params = [status, reviewed_by, review_notes, userDocumentId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
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

        const query = `
            UPDATE user_documents ud
            SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
            WHERE ud.id = $4
            ${aclClause}
            RETURNING *
        `;

        const result = await executor.query(query, params);

        if (result.rows.length === 0) {
            throw new Error('User document not found');
        }

        return result.rows[0];
    };

    const deleteUserDocument = async (userId, userDocumentId, options = {}) => {
        const executor = getExecutor(options);
        const docResult = await executor.query(
            'SELECT file_id FROM user_documents WHERE user_id = $1 AND id = $2',
            [userId, userDocumentId]
        );

        if (docResult.rows.length === 0) {
            throw new Error('Document not found or access denied');
        }

        const fileId = docResult.rows[0].file_id;
        const deleteResult = await executor.query(
            'DELETE FROM user_documents WHERE user_id = $1 AND id = $2 RETURNING *',
            [userId, userDocumentId]
        );

        return {
            document: deleteResult.rows[0],
            fileId
        };
    };

    return {
        getUserDocuments,
        getUserDocumentById,
        getUserOrganization,
        upsertUserDocument,
        updateUserDocumentStatus,
        deleteUserDocument
    };
};
