module.exports = ({
    calendarRepository,
    applicantsStatusCommandPort
}) => {
    const markCompleted = async (id, notes, userId, options = {}) => {
        const data = await calendarRepository.updateStatus(id, 'completed', userId, notes, options);
        if (!data) {
            return null;
        }

        const applicantId = data.applicant_id || await calendarRepository.getApplicantIdByInterviewId(id);
        if (applicantId) {
            await applicantsStatusCommandPort.updateApplicantStatus(applicantId, 'interview_completed', userId);
        }

        return data;
    };

    const markNoShow = async (id, notes, userId, options = {}) => {
        return await calendarRepository.updateStatus(id, 'no_show', userId, notes, options);
    };

    return {
        markCompleted,
        markNoShow
    };
};
