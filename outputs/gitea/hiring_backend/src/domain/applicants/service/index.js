const createAudit = require('./shared/audit');
const createApplicantChildAudit = require('./shared/applicantChildAudit');
const createTransaction = require('./shared/transaction');
const createEmailOutbox = require('./shared/emailOutbox');
const createNotificationOutbox = require('./shared/notificationOutbox');
const {
    APPLICANT_AUDIT_FIELDS,
    NOTE_AUDIT_FIELDS,
    ATTACHMENT_AUDIT_FIELDS,
    STATUS_LABELS_CS
} = require('./shared/constants');

const createLifecycle = require('./lifecycle');
const createQueries = require('./queries');
const createNotes = require('./notes');
const createAttachments = require('./attachments');
const createCommunication = require('./communication');

module.exports = ({
    db,
    applicantsRepository,
    attachmentsRepository,
    statusRepository,
    notesRepository,
    jobsRepository,
    applicantEmailPort,
    sideEffectOutboxService,
    audit
}) => {
    const { emitAudit, createSnapshot, getChangedFields } = createAudit({ audit });
    const applicantChildAudit = createApplicantChildAudit({
        emitAudit,
        createSnapshot,
        getChangedFields
    });
    const { runInTransaction, runWriteWithOutbox } = createTransaction({ db });

    const {
        queueApplicationReceivedEmail,
        queueApplicationUnderReviewEmail,
        queueRejectionEmail
    } = createEmailOutbox({
        sideEffectOutboxService
    });

    const { queueRoleNotification } = createNotificationOutbox({
        sideEffectOutboxService
    });

    const lifecycle = createLifecycle({
        applicantsRepository,
        statusRepository,
        jobsRepository,
        runInTransaction,
        runWriteWithOutbox,
        queueApplicationReceivedEmail,
        queueRoleNotification,
        emitAudit,
        createSnapshot,
        getChangedFields,
        APPLICANT_AUDIT_FIELDS,
        statusOutbox: {
            queueApplicationUnderReviewEmail,
            queueRejectionEmail,
            queueRoleNotification
        },
        auditSupport: {
            emitAudit,
            createSnapshot,
            getChangedFields,
            APPLICANT_AUDIT_FIELDS
        },
        STATUS_LABELS_CS
    });

    const queries = createQueries({
        applicantsRepository,
        statusRepository,
        attachmentsRepository
    });

    const notes = createNotes({
        notesRepository,
        applicantsRepository,
        NOTE_AUDIT_FIELDS,
        applicantChildAudit
    });

    const attachments = createAttachments({
        attachmentsRepository,
        applicantsRepository,
        emitAudit,
        createSnapshot,
        getChangedFields,
        ATTACHMENT_AUDIT_FIELDS
    });

    const communication = createCommunication({
        applicantsRepository,
        applicantEmailPort
    });

    return {
        ...lifecycle,
        ...queries,
        ...notes,
        ...attachments,
        ...communication
    };
};
