const reminderTemplate = require('@shared/emailTemplates/interviewReminderTemplate');

module.exports = ({
    calendarRepository,
    logger,
    sendOrQueueInterviewEmail
}) => {
    const sendReminderEmail = async (interview) => {
        try {
            const scheduledDate = new Date(interview.scheduled_at);
            const formattedDate = scheduledDate.toLocaleDateString('cs-CZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Europe/Prague'
            });
            const formattedTime = scheduledDate.toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Prague'
            });

            const participants = await calendarRepository.getParticipants(interview.id);
            const participantsDisplay = participants
                .filter((participant) => participant.role !== 'organizer')
                .map((participant) => participant.user_name
                    ? `${participant.user_name} ${participant.user_surname || ''}`.trim()
                    : participant.external_name)
                .filter(Boolean)
                .join(', ');

            const emailData = {
                applicantName: `${interview.applicant_name} ${interview.applicant_surname}`,
                interviewTitle: interview.title,
                formattedDate,
                formattedTime,
                duration: interview.duration_minutes,
                locationType: interview.location_type,
                location: interview.location || '',
                onlineMeetingLink: interview.online_meeting_link || '',
                participants: participantsDisplay,
                organizationName: interview.organization_name || 'Krajská Zdravotní a.s.'
            };

            const { html, text } = reminderTemplate.generate(emailData);

            const reminderDispatch = await sendOrQueueInterviewEmail({
                to: interview.applicant_email,
                subject: `Připomínka pohovoru - ${interview.title}`,
                text,
                html,
                audit: {
                    action: 'email.interview.reminder.applicant',
                    resourceType: 'interview',
                    resourceId: interview.id,
                    organizationId: interview.organization_id || null
                }
            }, {
                interviewId: interview.id,
                organizationId: interview.organization_id || null
            });

            logger.info('Interview reminder sent', {
                interviewId: interview.id,
                applicantEmail: interview.applicant_email,
                queued: reminderDispatch.queued,
                outboxId: reminderDispatch.outboxId
            });
        } catch (error) {
            logger.error('Failed to send reminder email', {
                error: error.message,
                interviewId: interview.id
            });
            throw error;
        }
    };

    const sendReminders = async () => {
        try {
            const interviews = await calendarRepository.getDueReminders();

            logger.info(`Found ${interviews.length} interviews needing reminders`);

            let sentCount = 0;
            for (const interview of interviews) {
                try {
                    await sendReminderEmail(interview);
                    await calendarRepository.markReminderSent(interview.id);
                    sentCount += 1;
                } catch (error) {
                    logger.error('Failed to send reminder for interview', {
                        error: error.message,
                        interviewId: interview.id
                    });
                }
            }

            logger.info(`Sent ${sentCount} interview reminders`);
            return sentCount;
        } catch (error) {
            logger.error('Failed to send reminders', { error: error.message });
            throw error;
        }
    };

    return {
        sendReminders,
        sendReminderEmail
    };
};
