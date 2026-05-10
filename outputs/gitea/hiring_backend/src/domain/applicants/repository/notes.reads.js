module.exports = ({
    db,
    getExecutor,
    ACCESS_LEVELS,
    buildNotePermissionJoin
}) => {
    const getNotesByApplicantId = async (applicantId, options = {}) => {
        const executor = getExecutor(options);
        const params = [applicantId];
        const permissionJoin = options.actorUserId
            ? buildNotePermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const sql = `
            SELECT
                an.id,
                an.applicant_id,
                an.author_id,
                an.note,
                an.created_at,
                an.updated_at,
                u.name as author_name,
                u.surname as author_surname,
                u.email as author_email
            FROM applicant_notes an
            JOIN applicants a ON a.id = an.applicant_id
            ${permissionJoin}
            LEFT JOIN users u ON an.author_id = u.id
            WHERE an.applicant_id = $1
            ORDER BY an.created_at DESC
        `;

        const { rows } = await executor.query(sql, params);
        return rows;
    };

    const getNoteById = async (noteId, options = {}) => {
        const executor = getExecutor(options);
        const params = [noteId];
        const permissionJoin = options.actorUserId
            ? buildNotePermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const sql = `
            SELECT
                an.id,
                an.applicant_id,
                an.author_id,
                an.note,
                an.created_at,
                an.updated_at,
                u.name as author_name,
                u.surname as author_surname,
                u.email as author_email
            FROM applicant_notes an
            JOIN applicants a ON a.id = an.applicant_id
            ${permissionJoin}
            LEFT JOIN users u ON an.author_id = u.id
            WHERE an.id = $1
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0];
    };

    const getDefaultAdminAuthorId = async () => {
        const { rows } = await db.query(
            `SELECT id FROM users WHERE email = $1 LIMIT 1`, [process.env.DEFAULT_ADMIN_EMAIL || 'admin@kzcr.eu']
        );
        return rows[0]?.id || null;
    };

    return {
        getNotesByApplicantId,
        getNoteById,
        getDefaultAdminAuthorId
    };
};
