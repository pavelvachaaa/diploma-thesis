const createParticipantMutations = require('./participantMutations');
const createInvitationResend = require('./invitationResend');
const createAttendance = require('./attendance');

module.exports = (deps) => {
    const participantDeps = {
        ...deps,
        runtimeSupport: deps.runtimeSupport || {
            logger: deps.logger,
            runBestEffort: deps.runBestEffort
        },
        auditSupport: deps.auditSupport || {
            emitAudit: deps.emitAudit
        },
        participantNotifications: deps.participantNotifications || {
            notifyAddedParticipant: deps.notifyAddedParticipant,
            sendInvitationToParticipant: deps.sendInvitationToParticipant
        },
        resendNotifications: deps.resendNotifications || {
            sendInvitationToApplicant: deps.sendInvitationToApplicant,
            sendInvitationToParticipant: deps.sendInvitationToParticipant
        }
    };

    return {
        ...createParticipantMutations(participantDeps),
        ...createInvitationResend(participantDeps),
        ...createAttendance(participantDeps)
    };
};
