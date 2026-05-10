const {
    ACCESS_LEVELS,
    addInterviewPermissionExists,
    addInterviewPermissionJoin,
    getExecutor
} = require('./shared');
const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({ db, logger }) => {
    const addAttachment = async (interviewId, fileData, options = {}) => {
        const executor = getExecutor(db, options);
        const { file_id, uploaded_by } = fileData;
        const params = [interviewId, file_id, uploaded_by];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addInterviewPermissionExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const insertQuery = `
            INSERT INTO interview_attachments (
                interview_id,
                file_id,
                uploaded_by
            )
            SELECT ie.id, $2, $3
            FROM interview_events ie
            WHERE ie.id = $1
            ${aclClause}
            RETURNING *
        `;

        const { rows } = await executor.query(insertQuery, params);
        if (rows.length === 0) {
            return null;
        }

        const fetchResult = await executor.query(`
            SELECT
                ia.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket
            FROM interview_attachments ia
            JOIN files f ON f.id = ia.file_id
            WHERE ia.id = $1
        `, [rows[0].id]);

        logger.info('Attachment added to interview', {
            interviewId,
            attachmentId: rows[0].id
        });

        return fetchResult.rows[0];
    };

    const getAttachments = async (interviewId, options = {}) => {
        const params = [interviewId];
        const permissionJoin = options.actorUserId
            ? addInterviewPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const query = `
            SELECT
                ia.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket,
                u.name as uploader_name,
                u.surname as uploader_surname
            FROM interview_attachments ia
            JOIN interview_events ie ON ie.id = ia.interview_id
            JOIN applicants a ON a.id = ie.applicant_id
            ${permissionJoin}
            JOIN files f ON f.id = ia.file_id
            LEFT JOIN users u ON ia.uploaded_by = u.id
            WHERE ia.interview_id = $1
            ORDER BY ia.uploaded_at DESC
        `;

        const { rows } = await db.query(query, params);
        return rows;
    };

    const getAttachmentById = async (attachmentId, options = {}) => {
        const params = [attachmentId];
        const permissionJoin = options.actorUserId
            ? addInterviewPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const query = `
            SELECT
                ia.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket,
                u.name as uploader_name,
                u.surname as uploader_surname
            FROM interview_attachments ia
            JOIN interview_events ie ON ie.id = ia.interview_id
            JOIN applicants a ON a.id = ie.applicant_id
            ${permissionJoin}
            JOIN files f ON f.id = ia.file_id
            LEFT JOIN users u ON ia.uploaded_by = u.id
            WHERE ia.id = $1
        `;

        const { rows } = await db.query(query, params);
        return rows[0] || null;
    };

    const deleteAttachment = async (attachmentId, options = {}) => {
        const executor = getExecutor(db, options);
        const params = [attachmentId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM interview_events ie
                    WHERE ie.id = ia.interview_id${addClause('AND', addInterviewPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE,
                        interviewAlias: 'ie'
                    }))}`
            );
        }

        const deleteQuery = `
            DELETE FROM interview_attachments ia
            WHERE ia.id = $1
            ${aclClause}
            RETURNING *
        `;
        const { rows } = await executor.query(deleteQuery, params);

        if (rows.length === 0) {
            return null;
        }

        logger.info('Attachment deleted', { attachmentId });
        return rows[0];
    };

    return {
        addAttachment,
        getAttachments,
        getAttachmentById,
        deleteAttachment
    };
};
