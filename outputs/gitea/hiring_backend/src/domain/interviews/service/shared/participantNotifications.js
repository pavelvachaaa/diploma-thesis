module.exports = ({ enqueueParticipantScheduledNotification, logger }) => {
    const notifyParticipants = async (participants, interview, createdBy) => {
        for (const participant of participants) {
            if (!participant.user_id || participant.user_id === createdBy || participant.role === 'organizer') {
                continue;
            }

            try {
                await enqueueParticipantScheduledNotification({
                    participant,
                    interview,
                    idempotencyContext: 'create'
                });
            } catch (error) {
                logger.error('Failed to enqueue interview participant notification intent', {
                    error: error.message,
                    userId: participant.user_id,
                    interviewId: interview.id
                });
            }
        }
    };

    const notifyAddedParticipant = async (participant, interview) => {
        if (!participant?.user_id || participant.role === 'organizer') {
            return;
        }

        try {
            await enqueueParticipantScheduledNotification({
                participant,
                interview,
                idempotencyContext: 'participant-added'
            });
        } catch (error) {
            logger.error('Failed to enqueue newly added participant notification intent', {
                error: error.message,
                userId: participant.user_id,
                interviewId: interview.id
            });
        }
    };

    return {
        notifyParticipants,
        notifyAddedParticipant
    };
};
