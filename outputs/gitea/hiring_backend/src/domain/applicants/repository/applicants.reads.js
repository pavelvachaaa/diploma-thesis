module.exports = ({
    db,
    getExecutor,
    ACCESS_LEVELS,
    buildApplicantPermissionJoin
}) => {
    const getApplicantsByJobId = async (jobId, options = {}) => {
        const executor = getExecutor(options);
        const params = [jobId];
        let permissionJoin = '';

        if (options.actorUserId) {
            permissionJoin = buildApplicantPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            });
        }

        const sql = `
            SELECT
                a.*,
                jp.title as job_title,
                o.name as organization_name,
                aps.name as current_status_name,
                aps.description as current_status_description,
                ca.status as cv_analysis_status,
                ca.evaluation_score as cv_analysis_score,
                ca.processed_at as cv_analysis_processed_at
            FROM applicants a
            JOIN job_postings_with_status jp ON a.job_posting_id = jp.id
            ${permissionJoin}
            JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN application_statuses aps ON a.current_status = aps.name
            LEFT JOIN LATERAL (
                SELECT ca2.status, ca2.evaluation_score, ca2.processed_at
                FROM cv_analyses ca2
                WHERE ca2.applicant_id = a.id
                ORDER BY ca2.processed_at DESC NULLS LAST
                LIMIT 1
            ) ca ON true
            WHERE a.job_posting_id = $1
            ORDER BY a.applied_at DESC
        `;

        const { rows } = await executor.query(sql, params);
        return rows;
    };

    const getApplicantById = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        let permissionJoin = '';

        if (options.actorUserId) {
            permissionJoin = buildApplicantPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            });
        }

        const sql = `
            SELECT
                a.*,
                jp.title as job_title,
                o.name as organization_name,
                aps.name as current_status_name,
                aps.description as current_status_description
            FROM applicants a
            JOIN job_postings_with_status jp ON a.job_posting_id = jp.id
            ${permissionJoin}
            JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN application_statuses aps ON a.current_status = aps.name
            WHERE a.id = $1
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0];
    };

    const getNoteByIdWithApplicant = async (noteId) => {
        const sql = `
            SELECT
                an.*,
                a.organization_id,
                a.job_posting_id
            FROM applicant_notes an
            JOIN applicants a ON an.applicant_id = a.id
            WHERE an.id = $1
        `;

        const { rows } = await db.query(sql, [noteId]);
        return rows[0] || null;
    };

    return {
        getApplicantsByJobId,
        getApplicantById,
        getNoteByIdWithApplicant
    };
};
