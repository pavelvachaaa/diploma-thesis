module.exports = ({ db, logger }) => {
    const markReminderSent = async (id) => {
        const updateQuery = `
            UPDATE interview_events
            SET reminder_sent_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        `;

        const { rows } = await db.query(updateQuery, [id]);

        if (rows.length === 0) {
            return false;
        }

        logger.info('Reminder marked as sent', { interviewId: id });
        return true;
    };

    return {
        markReminderSent
    };
};
