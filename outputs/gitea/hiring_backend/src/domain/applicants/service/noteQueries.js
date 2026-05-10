module.exports = ({ notesRepository }) => ({
    getApplicantNotes: (applicantId, options = {}) => notesRepository.getNotesByApplicantId(applicantId, options)
});
