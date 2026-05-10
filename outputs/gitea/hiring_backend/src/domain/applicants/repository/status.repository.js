const {
    ACCESS_LEVELS,
    RESOURCE_TYPES,
    addPermissionExists,
    addExistsClause,
    addClause
} = require('@shared/authz/rebacSql');

module.exports = ({ db }) => {
    const getExecutor = (options = {}) => options.client || db;

    const buildStatusPermissionExists = ({
        params,
        actorUserId,
        minAccess = ACCESS_LEVELS.READ
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.JOB_POSTING,
        resourceAlias: 'a',
        resourceIdColumn: 'job_posting_id',
        minAccess
    });

    const getAllStatuses = async () => {
        const sql = `
            SELECT name, description
            FROM application_statuses
            ORDER BY
                CASE name
                    WHEN 'submitted' THEN 1
                    WHEN 'under_review' THEN 2
                    WHEN 'interview_scheduled' THEN 3
                    WHEN 'interview_completed' THEN 4
                    WHEN 'accepted' THEN 5
                    WHEN 'rejected' THEN 6
                    WHEN 'withdrawn' THEN 7
                    ELSE 8
                END
        `;

        const { rows } = await db.query(sql);
        return rows;
    };

    const getStatusByName = async (name, options = {}) => {
        const executor = getExecutor(options);
        const sql = `
            SELECT name, description
            FROM application_statuses
            WHERE name = $1
        `;

        const { rows } = await executor.query(sql, [name]);
        return rows[0];
    };

    const createStatusHistory = async (statusHistoryData, options = {}) => {
        const {
            applicant_id,
            status_name,
            changed_by,
            notes
        } = statusHistoryData;
        const executor = getExecutor(options);

        const sql = `
            INSERT INTO applicant_status_history (id, applicant_id, status_name, changed_at, changed_by, notes)
            VALUES (gen_random_uuid(), $1, $2, NOW(), $3, $4)
            RETURNING *
        `;

        const { rows } = await executor.query(sql, [
            applicant_id,
            status_name,
            changed_by,
            notes
        ]);

        return rows[0];
    };

    const getStatusHistoryByApplicantId = async (applicantId, options = {}) => {
        const executor = getExecutor(options);
        const params = [applicantId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM applicants a
                    WHERE a.id = ash.applicant_id${addClause('AND', buildStatusPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const sql = `
            SELECT
                ash.id,
                ash.applicant_id,
                ash.status_name,
                ash.changed_at,
                ash.changed_by,
                ash.notes,
                aps.description as status_description,
                u.name as changed_by_name,
                u.surname as changed_by_surname
            FROM applicant_status_history ash
            JOIN application_statuses aps ON ash.status_name = aps.name
            LEFT JOIN users u ON ash.changed_by = u.id
            WHERE ash.applicant_id = $1
            ${aclExists}
            ORDER BY ash.changed_at DESC
        `;

        const { rows } = await executor.query(sql, params);
        return rows;
    };

    return { getAllStatuses, getStatusByName, createStatusHistory, getStatusHistoryByApplicantId };
};
