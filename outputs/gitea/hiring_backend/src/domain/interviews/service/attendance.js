module.exports = ({ calendarRepository }) => {
    const confirmAttendance = async (interviewId, userId, options = {}) => {
        const participants = await calendarRepository.getParticipants(interviewId, options);
        const participant = participants.find((candidate) => candidate.user_id === userId);

        if (!participant) {
            throw new Error('Participant not found');
        }

        return calendarRepository.updateParticipantStatus(participant.id, 'accepted', options);
    };

    return {
        confirmAttendance
    };
};
