const createInterviewCrud = require('./interviewCrud');
const createInterviewStatus = require('./interviewStatus');

module.exports = (deps) => {
    const interviewCrudDeps = {
        ...deps,
        applicantDocumentsQueryPort: deps.applicantDocumentsQueryPort || deps.documentsReadPort,
        applicantsStatusCommandPort: deps.applicantsStatusCommandPort || deps.applicantsLifecyclePort,
        runtimeSupport: deps.runtimeSupport || {
            logger: deps.logger,
            runBestEffort: deps.runBestEffort
        },
        auditSupport: deps.auditSupport || {
            emitAudit: deps.emitAudit,
            createInterviewSnapshot: deps.createInterviewSnapshot,
            getChangedFields: deps.getChangedFields
        },
        interviewNotifications: deps.interviewNotifications || {
            enqueueInterviewScheduledRoleNotification: deps.enqueueInterviewScheduledRoleNotification,
            enqueueInterviewCancelledRoleNotification: deps.enqueueInterviewCancelledRoleNotification,
            notifyParticipants: deps.notifyParticipants,
            sendInvitationEmails: deps.sendInvitationEmails,
            sendUpdateNotifications: deps.sendUpdateNotifications,
            sendCancellationNotifications: deps.sendCancellationNotifications
        }
    };

    const interviewStatusDeps = {
        ...deps,
        applicantsStatusCommandPort: deps.applicantsStatusCommandPort || deps.applicantsLifecyclePort
    };

    return {
        ...createInterviewCrud(interviewCrudDeps),
        ...createInterviewStatus(interviewStatusDeps)
    };
};
