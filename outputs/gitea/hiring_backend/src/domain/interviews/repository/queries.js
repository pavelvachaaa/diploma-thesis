const {
    ACCESS_LEVELS,
    addInterviewPermissionJoin
} = require('./shared');

module.exports = ({ db, getParticipants, getAttachments }) => {
    const getAll = async (options = {}) => {
        const {
            organizationId,
            applicantId,
            createdBy,
            status,
            startDate,
            endDate,
            page = 0,
            limit = 50,
            actorUserId = null,
            minAccess = ACCESS_LEVELS.READ
        } = options;

        const params = [];
        const conditions = [];
        const permissionJoin = actorUserId
            ? addInterviewPermissionJoin({
                params,
                actorUserId,
                minAccess
            })
            : '';

        let query = `
            SELECT
                ie.*,
                a.name as applicant_name,
                a.surname as applicant_surname,
                a.email as applicant_email,
                jp.title as job_title,
                u.name as creator_name,
                u.surname as creator_surname,
                (
                    SELECT COUNT(*)
                    FROM interview_participants ip
                    WHERE ip.interview_id = ie.id
                ) as participant_count
            FROM interview_events ie
            JOIN applicants a ON ie.applicant_id = a.id
            ${permissionJoin}
            LEFT JOIN job_postings jp ON ie.job_posting_id = jp.id
            LEFT JOIN users u ON ie.created_by = u.id
        `;

        if (organizationId) {
            if (Array.isArray(organizationId)) {
                conditions.push(`ie.organization_id = ANY($${params.length + 1}::uuid[])`);
                params.push(organizationId);
            } else {
                conditions.push(`ie.organization_id = $${params.length + 1}`);
                params.push(organizationId);
            }
        }

        if (applicantId) {
            conditions.push(`ie.applicant_id = $${params.length + 1}`);
            params.push(applicantId);
        }

        if (createdBy) {
            conditions.push(`ie.created_by = $${params.length + 1}`);
            params.push(createdBy);
        }

        if (status) {
            conditions.push(`ie.status = $${params.length + 1}`);
            params.push(status);
        }

        if (startDate) {
            conditions.push(`ie.scheduled_at >= $${params.length + 1}`);
            params.push(startDate);
        }

        if (endDate) {
            conditions.push(`ie.scheduled_at <= $${params.length + 1}`);
            params.push(endDate);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ' ORDER BY ie.scheduled_at ASC';
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, page * limit);

        const { rows } = await db.query(query, params);
        return rows;
    };

    const getApplicantIdByInterviewId = async (interviewId) => {
        const { rows: interviewRows } = await db.query(
            'SELECT applicant_id FROM interview_events WHERE id = $1',
            [interviewId]
        );

        if (interviewRows.length === 0) {
            return null;
        }

        return interviewRows[0].applicant_id;
    };

    const getById = async (id, options = {}) => {
        const params = [id];
        const permissionJoin = options.actorUserId
            ? addInterviewPermissionJoin({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })
            : '';

        const interviewQuery = `
            SELECT
                ie.*,
                a.name as applicant_name,
                a.surname as applicant_surname,
                a.email as applicant_email,
                a.phone as applicant_phone,
                jp.title as job_title,
                u.name as creator_name,
                u.surname as creator_surname,
                u.email as creator_email,
                o.name as organization_name
            FROM interview_events ie
            JOIN applicants a ON ie.applicant_id = a.id
            ${permissionJoin}
            LEFT JOIN job_postings jp ON ie.job_posting_id = jp.id
            LEFT JOIN users u ON ie.created_by = u.id
            LEFT JOIN organizations o ON ie.organization_id = o.id
            WHERE ie.id = $1
        `;

        const { rows: interviewRows } = await db.query(interviewQuery, params);

        if (interviewRows.length === 0) {
            return null;
        }

        const interview = interviewRows[0];
        interview.participants = await getParticipants(id, options);
        interview.attachments = await getAttachments(id, options);
        return interview;
    };

    const getDueReminders = async () => {
        const query = `
            SELECT
                ie.*,
                a.name as applicant_name,
                a.surname as applicant_surname,
                a.email as applicant_email,
                u.name as creator_name,
                u.surname as creator_surname,
                u.email as creator_email
            FROM interview_events ie
            JOIN applicants a ON ie.applicant_id = a.id
            JOIN users u ON ie.created_by = u.id
            WHERE ie.status IN ('scheduled', 'confirmed')
              AND ie.reminder_sent_at IS NULL
              AND ie.scheduled_at > NOW()
              AND ie.scheduled_at <= NOW() + INTERVAL '24 hours'
            ORDER BY ie.scheduled_at ASC
        `;

        const { rows } = await db.query(query);
        return rows;
    };

    const getStatusHistory = async (interviewId, options = {}) => {
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
                ish.*,
                u.name as changed_by_name,
                u.surname as changed_by_surname
            FROM interview_status_history ish
            JOIN interview_events ie ON ie.id = ish.interview_id
            JOIN applicants a ON a.id = ie.applicant_id
            ${permissionJoin}
            LEFT JOIN users u ON ish.changed_by = u.id
            WHERE ish.interview_id = $1
            ORDER BY ish.changed_at DESC
        `;

        const { rows } = await db.query(query, params);
        return rows;
    };

    return {
        getAll,
        getApplicantIdByInterviewId,
        getById,
        getDueReminders,
        getStatusHistory
    };
};
