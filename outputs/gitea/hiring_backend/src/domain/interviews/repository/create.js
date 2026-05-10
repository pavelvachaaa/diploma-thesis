module.exports = ({
    logger,
    runInTransaction
}) => {
    const create = async (data, participants = []) => {
        try {
            const interview = await runInTransaction(async (client) => {
                const {
                    applicant_id,
                    job_posting_id,
                    organization_id,
                    created_by,
                    title,
                    description,
                    scheduled_at,
                    duration_minutes = 60,
                    location_type,
                    location,
                    online_meeting_link,
                    notes
                } = data;

                const insertQuery = `
                    INSERT INTO interview_events (
                        applicant_id,
                        job_posting_id,
                        organization_id,
                        created_by,
                        title,
                        description,
                        scheduled_at,
                        duration_minutes,
                        location_type,
                        location,
                        online_meeting_link,
                        notes,
                        status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'scheduled')
                    RETURNING *
                `;

                const { rows } = await client.query(insertQuery, [
                    applicant_id,
                    job_posting_id || null,
                    organization_id,
                    created_by,
                    title,
                    description || null,
                    scheduled_at,
                    duration_minutes,
                    location_type,
                    location || null,
                    online_meeting_link || null,
                    notes || null
                ]);

                const createdInterview = rows[0];

                if (participants && participants.length > 0) {
                    for (const participant of participants) {
                        await client.query(`
                            INSERT INTO interview_participants (
                                interview_id,
                                user_id,
                                external_email,
                                external_name,
                                role,
                                attendance_status
                            ) VALUES ($1, $2, $3, $4, $5, 'pending')
                        `, [
                            createdInterview.id,
                            participant.user_id || null,
                            participant.external_email || null,
                            participant.external_name || null,
                            participant.role || 'interviewer'
                        ]);
                    }
                }

                await client.query(`
                    INSERT INTO interview_status_history (
                        interview_id,
                        old_status,
                        new_status,
                        changed_by,
                        notes
                    ) VALUES ($1, NULL, 'scheduled', $2, 'Vytvořili jsme pohovor')
                `, [createdInterview.id, created_by]);

                return createdInterview;
            }, { label: 'interviews.create' });

            logger.info('Interview created successfully', {
                interviewId: interview.id,
                applicantId: interview.applicant_id,
                organizationId: interview.organization_id,
                createdBy: interview.created_by
            });

            return interview;
        } catch (error) {
            logger.error('Failed to create interview', {
                error: error.message,
                data
            });
            throw error;
        }
    };

    return {
        create
    };
};
