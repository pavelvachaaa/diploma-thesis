module.exports = ({
    db,
    logger,
    ACCESS_LEVELS,
    addInterviewPermissionExists
}) => {
    const update = async (id, data, options = {}) => {
        const {
            title,
            description,
            scheduled_at,
            duration_minutes,
            location_type,
            location,
            online_meeting_link,
            notes
        } = data;

        const params = [
            title,
            description,
            scheduled_at,
            duration_minutes,
            location_type,
            location,
            online_meeting_link,
            notes,
            id
        ];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addInterviewPermissionExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const updateQuery = `
            UPDATE interview_events ie
            SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                scheduled_at = COALESCE($3, scheduled_at),
                duration_minutes = COALESCE($4, duration_minutes),
                location_type = COALESCE($5, location_type),
                location = COALESCE($6, location),
                online_meeting_link = COALESCE($7, online_meeting_link),
                notes = COALESCE($8, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE ie.id = $9
            ${aclClause}
            RETURNING *
        `;

        const { rows } = await db.query(updateQuery, params);

        if (rows.length === 0) {
            return null;
        }

        logger.info('Interview updated', {
            interviewId: id,
            updatedFields: Object.keys(data)
        });

        return rows[0];
    };

    const cancel = async (id, reason, cancelledBy, options = {}) => {
        const params = [reason, id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addInterviewPermissionExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const updateQuery = `
            UPDATE interview_events ie
            SET
                status = 'cancelled',
                cancelled_at = CURRENT_TIMESTAMP,
                cancellation_reason = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE ie.id = $2
            ${aclClause}
            RETURNING *
        `;

        const { rows } = await db.query(updateQuery, params);

        if (rows.length === 0) {
            return null;
        }

        await db.query(`
            INSERT INTO interview_status_history (
                interview_id,
                old_status,
                new_status,
                changed_by,
                notes
            ) VALUES ($1, 'scheduled', 'cancelled', $2, $3)
        `, [id, cancelledBy, `Cancelled: ${reason}`]);

        logger.info('Interview cancelled', {
            interviewId: id,
            cancelledBy,
            reason
        });

        return rows[0];
    };

    return {
        update,
        cancel
    };
};
