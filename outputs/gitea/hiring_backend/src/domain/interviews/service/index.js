const createAudit = require('./shared/audit');
const createStorage = require('./shared/storage');
const createBackground = require('./shared/background');
const createEmailDispatch = require('./shared/emailDispatch');
const createParticipantNotifications = require('./shared/participantNotifications');
const createInterviewEvents = require('@domain/interviews/events');

const createNotifications = require('./notifications');
const createLifecycle = require('./lifecycle');
const createParticipants = require('./participants');
const createAttachments = require('./attachments');
const createQueries = require('./queries');
const createReminders = require('./reminders');

module.exports = ({
    calendarRepository,
    logger,
    applicantsStatusCommandPort,
    applicantDocumentsQueryPort,
    sideEffectOutboxService,
    audit,
    fileGateway,
    db,
    transactionManager
}) => {
    const { emitAudit, createInterviewSnapshot, getChangedFields } = createAudit({ audit });
    const { detectBucketFromKey } = createStorage();
    const { runBestEffort } = createBackground({ logger });

    const {
        enqueueInterviewScheduledRoleNotification,
        enqueueInterviewCancelledRoleNotification,
        enqueueParticipantScheduledNotification
    } = createInterviewEvents({
        sideEffectOutboxService,
        logger
    });

    const {
        sendOrQueueInterviewEmail,
        buildStorageAttachmentReference
    } = createEmailDispatch({
        sideEffectOutboxService,
        detectBucketFromKey,
    });

    const {
        notifyParticipants,
        notifyAddedParticipant
    } = createParticipantNotifications({
        enqueueParticipantScheduledNotification,
        logger
    });

    const notifications = createNotifications({
        calendarRepository,
        logger,
        sendOrQueueInterviewEmail,
        buildStorageAttachmentReference
    });

    const lifecycle = createLifecycle({
        calendarRepository,
        applicantDocumentsQueryPort,
        applicantsStatusCommandPort,
        runtimeSupport: {
            logger,
            runBestEffort
        },
        auditSupport: {
            emitAudit,
            createInterviewSnapshot,
            getChangedFields
        },
        interviewNotifications: {
            enqueueInterviewScheduledRoleNotification,
            enqueueInterviewCancelledRoleNotification,
            notifyParticipants,
            sendInvitationEmails: notifications.sendInvitationEmails,
            sendUpdateNotifications: notifications.sendUpdateNotifications,
            sendCancellationNotifications: notifications.sendCancellationNotifications
        }
    });

    const participants = createParticipants({
        calendarRepository,
        runtimeSupport: {
            logger,
            runBestEffort
        },
        auditSupport: {
            emitAudit
        },
        participantNotifications: {
            notifyAddedParticipant,
            sendInvitationToParticipant: notifications.sendInvitationToParticipant
        },
        resendNotifications: {
            sendInvitationToApplicant: notifications.sendInvitationToApplicant,
            sendInvitationToParticipant: notifications.sendInvitationToParticipant
        }
    });

    const attachments = createAttachments({
        calendarRepository,
        sideEffectOutboxService,
        fileGateway,
        db,
        transactionManager,
        logger
    });

    const queries = createQueries({
        calendarRepository
    });

    const reminders = createReminders({
        calendarRepository,
        logger,
        sendOrQueueInterviewEmail
    });

    return {
        ...lifecycle,
        ...participants,
        ...attachments,
        ...queries,
        ...reminders,
        ...notifications
    };
};
