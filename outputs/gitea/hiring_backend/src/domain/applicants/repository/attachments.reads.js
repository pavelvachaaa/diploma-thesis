module.exports = ({
    db,
    getExecutor,
    ACCESS_LEVELS,
    buildAttachmentPermissionJoin
}) => {
    const getByApplicantId = async (applicantId, options = {}) => {
        const executor = getExecutor(options);
        const params = [applicantId];
        const permissionJoin = options.actorUserId
            ? buildAttachmentPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const { rows } = await executor.query(`
            SELECT
                aa.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket,
                ds.description as status_description,
                ds.color as status_color,
                u.name as reviewed_by_name,
                u.surname as reviewed_by_surname
            FROM application_attachments aa
            JOIN applicants a ON a.id = aa.applicant_id
            ${permissionJoin}
            JOIN files f ON f.id = aa.file_id
            LEFT JOIN document_statuses ds ON aa.status = ds.name
            LEFT JOIN users u ON aa.reviewed_by = u.id
            WHERE aa.applicant_id = $1
            ORDER BY aa.uploaded_at`,
            params
        );
        return rows;
    };

    const getById = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        const permissionJoin = options.actorUserId
            ? buildAttachmentPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const { rows } = await executor.query(`
            SELECT
                aa.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket
            FROM application_attachments aa
            JOIN applicants a ON a.id = aa.applicant_id
            ${permissionJoin}
            JOIN files f ON f.id = aa.file_id
            WHERE aa.id = $1
        `, params);
        return rows[0] || null;
    };

    const getByIdWithApplicant = async (id) => {
        const { rows } = await db.query(`
            SELECT
                aa.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket,
                a.organization_id,
                a.job_posting_id
            FROM application_attachments aa
            JOIN applicants a ON aa.applicant_id = a.id
            JOIN files f ON f.id = aa.file_id
            WHERE aa.id = $1
        `, [id]);
        return rows[0] || null;
    };

    const getAllStatuses = async () => {
        const { rows } = await db.query('SELECT * FROM document_statuses ORDER BY name');
        return rows;
    };

    return {
        getByApplicantId,
        getById,
        getByIdWithApplicant,
        getAllStatuses
    };
};
