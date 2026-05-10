const createSendWelcomeEmail = require('./sendWelcomeEmail');
const createSendNotificationEmail = require('./sendNotificationEmail');
const createSendCustomEmail = require('./sendCustomEmail');
const createSendApplicantEmail = require('./sendApplicantEmail');
const createSendInterviewInvitation = require('./sendInterviewInvitation');
const createSendApplicationStatusEmail = require('./sendApplicationStatusEmail');
const createSendTestEmail = require('./sendTestEmail');
const createGetEmailTemplates = require('./getEmailTemplates');
const createGetEmailTemplate = require('./getEmailTemplate');
const createCreateEmailTemplate = require('./createEmailTemplate');
const createUpdateEmailTemplate = require('./updateEmailTemplate');
const createDeleteEmailTemplate = require('./deleteEmailTemplate');

module.exports = ({
    emailTemplatesStorePort,
    emailOutboxPort,
    emailPreferencesLookupPort,
    logger
}) => {
    const sendWelcomeEmail = createSendWelcomeEmail({ emailOutboxPort, logger });
    const sendNotificationEmail = createSendNotificationEmail({ emailOutboxPort, emailPreferencesLookupPort, logger });
    const sendCustomEmail = createSendCustomEmail({ emailOutboxPort, logger });
    const sendApplicantEmail = createSendApplicantEmail({ emailOutboxPort, logger });
    const sendInterviewInvitation = createSendInterviewInvitation({ emailOutboxPort, logger });
    const sendApplicationStatusEmail = createSendApplicationStatusEmail({ emailOutboxPort, logger });
    const sendTestEmail = createSendTestEmail({ emailOutboxPort, logger });

    const getEmailTemplates = createGetEmailTemplates({ emailTemplatesStorePort });
    const getEmailTemplate = createGetEmailTemplate({ emailTemplatesStorePort });
    const createEmailTemplate = createCreateEmailTemplate({ emailTemplatesStorePort });
    const updateEmailTemplate = createUpdateEmailTemplate({ emailTemplatesStorePort });
    const deleteEmailTemplate = createDeleteEmailTemplate({ emailTemplatesStorePort });

    const getHealthStatus = () => emailOutboxPort.getHealthStatus();

    return {
        sendWelcomeEmail,
        sendNotificationEmail,
        sendCustomEmail,
        sendApplicantEmail,
        sendInterviewInvitation,
        sendApplicationStatusEmail,
        sendTestEmail,
        getHealthStatus,
        getEmailTemplates,
        getEmailTemplate,
        createEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        // backward-compat aliases matching legacy emailService shape
        sendApplicationReceivedEmail: ({ applicant, job }) => sendApplicationStatusEmail({ status: 'received', applicant, job }),
        sendApplicationUnderReviewEmail: ({ applicant, job }) => sendApplicationStatusEmail({ status: 'under_review', applicant, job }),
        sendRejectionEmail: ({ applicant, job, notes }) => sendApplicationStatusEmail({ status: 'rejected', applicant, job, notes })
    };
};
