const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({
    getExecutor,
    ACCESS_LEVELS,
    buildAttachmentPermissionExists
}) => {
    const create = async (data, options = {}) => {
        const { applicant_id, file_id } = data;
        const executor = getExecutor(options);
        const insert = await executor.query(
            'INSERT INTO application_attachments (id, applicant_id, file_id, uploaded_at) VALUES (gen_random_uuid(), $1, $2, NOW()) RETURNING id',
            [applicant_id, file_id]
        );

        const { rows } = await executor.query(`
            SELECT
                aa.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket
            FROM application_attachments aa
            JOIN files f ON f.id = aa.file_id
            WHERE aa.id = $1
        `, [insert.rows[0].id]);
        return rows[0];
    };

    const deleteOne = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM applicants a
                    WHERE a.id = aa.applicant_id${addClause('AND', buildAttachmentPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(
            `DELETE FROM application_attachments aa
             WHERE aa.id = $1${aclExists}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    const updateStatus = async (id, statusData, options = {}) => {
        const { status, reviewed_by, review_notes } = statusData;
        const executor = getExecutor(options);
        const params = [status, reviewed_by, review_notes, id];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM applicants a
                    WHERE a.id = aa.applicant_id${addClause('AND', buildAttachmentPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const { rows } = await executor.query(`
            UPDATE application_attachments aa
            SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
            WHERE aa.id = $4${aclExists}
            RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        create,
        delete: deleteOne,
        updateStatus
    };
};
