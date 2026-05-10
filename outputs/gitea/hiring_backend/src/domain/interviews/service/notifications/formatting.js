const formatInterviewDateTime = (scheduledAt) => {
    const scheduledDate = new Date(scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('cs-CZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Prague'
    });
    const formattedTime = scheduledDate.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Prague'
    });

    return {
        formattedDate,
        formattedTime
    };
};

const buildParticipantsDisplay = (participants = []) => {
    return participants
        .filter((participant) => participant.role !== 'organizer')
        .map((participant) => participant.user_name
            ? `${participant.user_name} ${participant.user_surname || ''}`.trim()
            : participant.external_name)
        .filter(Boolean)
        .join(', ');
};

const getOrganizerFromInterview = (interview) => {
    return {
        name: interview.creator_name,
        surname: interview.creator_surname || '',
        email: interview.creator_email
    };
};

const getApplicantFromInterview = (interview) => {
    return {
        name: interview.applicant_name,
        surname: interview.applicant_surname,
        email: interview.applicant_email
    };
};

module.exports = {
    formatInterviewDateTime,
    buildParticipantsDisplay,
    getOrganizerFromInterview,
    getApplicantFromInterview
};
