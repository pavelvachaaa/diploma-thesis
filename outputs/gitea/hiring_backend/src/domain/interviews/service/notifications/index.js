const icalendar = require('@shared/calendar/icalendar');
const invitationTemplate = require('@shared/emailTemplates/interviewInvitationTemplate');
const participantInvitationTemplate = require('@shared/emailTemplates/interviewParticipantInvitationTemplate');
const cancellationTemplate = require('@shared/emailTemplates/interviewCancellationTemplate');
const participantCancellationTemplate = require('@shared/emailTemplates/interviewParticipantCancellationTemplate');
const formatting = require('./formatting');
const createInvitationHandlers = require('./invitations');
const createCancellationHandlers = require('./cancellations');

module.exports = ({
    calendarRepository,
    logger,
    sendOrQueueInterviewEmail,
    buildStorageAttachmentReference
}) => {
    const invitationHandlers = createInvitationHandlers({
        icalendar,
        invitationTemplate,
        participantInvitationTemplate,
        calendarRepository,
        logger,
        sendOrQueueInterviewEmail,
        buildStorageAttachmentReference,
        formatting
    });

    const cancellationHandlers = createCancellationHandlers({
        icalendar,
        cancellationTemplate,
        participantCancellationTemplate,
        logger,
        sendOrQueueInterviewEmail,
        formatting
    });

    const sendUpdateNotifications = async (interview) => {
        logger.info('Interview update notification triggered', {
            interviewId: interview.id
        });
    };

    return {
        ...invitationHandlers,
        sendUpdateNotifications,
        ...cancellationHandlers
    };
};
