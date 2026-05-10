const createApplicantEmail = require('./applicantEmail');
const createInterviewInvitation = require('./interviewInvitation');

module.exports = (deps) => ({
    ...createApplicantEmail(deps),
    ...createInterviewInvitation(deps)
});
