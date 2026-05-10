module.exports = ({
    ACCESS_LEVELS,
    addInterviewPermissionExists,
    addInterviewPermissionJoin,
    logger,
    runInTransaction
}) => {
    const updateStatus = async (id, newStatus, changedBy, notes = null, options = {}) => {
        try {
            const updatedInterview = await runInTransaction(async (client) => {
                const currentParams = [id];
                const currentJoin = options.actorUserId
                    ? `JOIN applicants a ON a.id = ie.applicant_id
                       ${addInterviewPermissionJoin({
                           params: currentParams,
                           actorUserId: options.actorUserId,
                           minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                       })}`
                    : '';

                const { rows: currentRows } = await client.query(
                    `SELECT ie.status
                     FROM interview_events ie
                     ${currentJoin}
                     WHERE ie.id = $1`,
                    currentParams
                );

                if (currentRows.length === 0) {
                    return null;
                }

                const oldStatus = currentRows[0].status;
                const updateParams = [newStatus, id];
                let aclClause = '';

                if (options.actorUserId) {
                    aclClause = ` AND ${addInterviewPermissionExists({
                        params: updateParams,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    })}`;
                }

                const updateQuery = `
                    UPDATE interview_events ie
                    SET
                        status = $1::interview_status,
                        updated_at = CURRENT_TIMESTAMP,
                        cancelled_at = CASE
                            WHEN $1::text = 'cancelled' THEN CURRENT_TIMESTAMP
                            ELSE cancelled_at
                        END
                    WHERE ie.id = $2
                    ${aclClause}
                    RETURNING *
                `;

                const { rows } = await client.query(updateQuery, updateParams);
                if (rows.length === 0) {
                    return null;
                }

                await client.query(`
                    INSERT INTO interview_status_history (
                        interview_id,
                        old_status,
                        new_status,
                        changed_by,
                        notes
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [id, oldStatus, newStatus, changedBy, notes]);

                return {
                    oldStatus,
                    interview: rows[0]
                };
            }, { label: 'interviews.updateStatus' });

            if (!updatedInterview) {
                return null;
            }

            logger.info('Interview status updated', {
                interviewId: id,
                oldStatus: updatedInterview.oldStatus,
                newStatus,
                changedBy
            });

            return updatedInterview.interview;
        } catch (error) {
            logger.error('Failed to update interview status', {
                error: error.message,
                interviewId: id,
                newStatus
            });
            throw error;
        }
    };

    return {
        updateStatus
    };
};
