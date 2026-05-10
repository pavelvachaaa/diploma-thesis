module.exports = ({
    calendarRepository,
    runtimeSupport,
    participantNotifications
}) => {
    const addParticipants = async (interviewId, participants, options = {}) => {
        const interview = await calendarRepository.getById(interviewId, options);

        if (!interview) {
            throw new Error('Interview not found');
        }

        if (interview.status === 'cancelled' || interview.status === 'completed') {
            throw new Error(`Cannot add participants to ${interview.status} interview`);
        }

        const added = [];
        for (const participant of participants) {
            const result = await calendarRepository.addParticipant(interviewId, participant, options);
            if (!result) {
                throw new Error('Interview not found');
            }
            added.push(result);
        }

        runtimeSupport.logger.info('Participants added to interview', {
            interviewId,
            count: added.length
        });

        runtimeSupport.runBestEffort({
            action: 'Failed to send invitations to newly added participants',
            interviewId,
            task: async () => {
                const fullInterview = await calendarRepository.getById(interviewId, options);

                for (const addedParticipant of added) {
                    const fullParticipant = fullInterview.participants.find((participant) => participant.id === addedParticipant.id);
                    if (!fullParticipant) {
                        continue;
                    }

                    await participantNotifications.notifyAddedParticipant(fullParticipant, fullInterview);

                    if (fullParticipant.user_email) {
                        try {
                            await participantNotifications.sendInvitationToParticipant(fullInterview, fullParticipant);
                            runtimeSupport.logger.info('Invitation sent to newly added participant', {
                                interviewId,
                                participantId: fullParticipant.id,
                                participantEmail: fullParticipant.user_email
                            });
                        } catch (emailError) {
                            runtimeSupport.logger.error('Failed to send invitation to newly added participant', {
                                error: emailError.message,
                                interviewId,
                                participantId: fullParticipant.id
                            });
                        }
                    }
                }
            }
        });

        return added;
    };

    const removeParticipant = async (interviewId, participantId, options = {}) => {
        const participants = await calendarRepository.getParticipants(interviewId, options);
        const participant = participants.find((candidate) => candidate.id === participantId);
        if (!participant) {
            return false;
        }

        return calendarRepository.removeParticipant(participantId, options);
    };

    return {
        addParticipants,
        removeParticipant
    };
};
