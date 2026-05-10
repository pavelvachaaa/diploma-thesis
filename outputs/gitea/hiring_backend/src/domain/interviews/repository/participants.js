const {
    ACCESS_LEVELS,
    addInterviewPermissionExists,
    addInterviewPermissionJoin
} = require('./shared');
const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({ db, logger }) => {
    const addParticipant = async (interviewId, participantData, options = {}) => {
        const {
            user_id,
            external_email,
            external_name,
            role = 'interviewer'
        } = participantData;

        const params = [
            interviewId,
            user_id || null,
            external_email || null,
            external_name || null,
            role
        ];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addInterviewPermissionExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const insertQuery = `
            INSERT INTO interview_participants (
                interview_id,
                user_id,
                external_email,
                external_name,
                role,
                attendance_status
            )
            SELECT ie.id, $2, $3, $4, $5, 'pending'
            FROM interview_events ie
            WHERE ie.id = $1
            ${aclClause}
            RETURNING *
        `;

        const { rows } = await db.query(insertQuery, params);
        if (rows.length === 0) {
            return null;
        }

        logger.info('Participant added to interview', {
            interviewId,
            participantId: rows[0].id,
            userId: user_id,
            externalEmail: external_email
        });

        return rows[0];
    };

    const removeParticipant = async (participantId, options = {}) => {
        const params = [participantId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM interview_events ie
                    WHERE ie.id = ip.interview_id${addClause('AND', addInterviewPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE,
                        interviewAlias: 'ie'
                    }))}`
            );
        }

        const deleteQuery = `
            DELETE FROM interview_participants ip
            WHERE ip.id = $1
            ${aclClause}
            RETURNING ip.id
        `;
        const { rows } = await db.query(deleteQuery, params);

        if (rows.length === 0) {
            return false;
        }

        logger.info('Participant removed from interview', { participantId });
        return true;
    };

    const getParticipants = async (interviewId, options = {}) => {
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
                ip.*,
                COALESCE(u.name, ip.external_name) as user_name,
                u.surname as user_surname,
                COALESCE(u.email, ip.external_email) as user_email
            FROM interview_participants ip
            JOIN interview_events ie ON ie.id = ip.interview_id
            JOIN applicants a ON a.id = ie.applicant_id
            ${permissionJoin}
            LEFT JOIN users u ON ip.user_id = u.id
            WHERE ip.interview_id = $1
            ORDER BY ip.created_at ASC
        `;

        const { rows } = await db.query(query, params);
        return rows;
    };

    const updateParticipantStatus = async (participantId, status, options = {}) => {
        const params = [status, participantId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM interview_events ie
                    WHERE ie.id = ip.interview_id${addClause('AND', addInterviewPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE,
                        interviewAlias: 'ie'
                    }))}`
            );
        }

        const updateQuery = `
            UPDATE interview_participants ip
            SET attendance_status = $1
            WHERE ip.id = $2
            ${aclClause}
            RETURNING *
        `;

        const { rows } = await db.query(updateQuery, params);

        if (rows.length === 0) {
            return null;
        }

        logger.info('Participant status updated', { participantId, status });
        return rows[0];
    };

    return {
        addParticipant,
        removeParticipant,
        getParticipants,
        updateParticipantStatus
    };
};
