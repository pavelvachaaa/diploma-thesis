module.exports = ({ calendarRepository }) => {
    const getInterviews = async (filters = {}) => {
        return await calendarRepository.getAll(filters);
    };

    const getInterviewById = async (id, options = {}) => {
        return await calendarRepository.getById(id, options);
    };

    const getStatusHistory = async (interviewId, options = {}) => {
        return await calendarRepository.getStatusHistory(interviewId, options);
    };

    return {
        getInterviews,
        getInterviewById,
        getStatusHistory
    };
};
