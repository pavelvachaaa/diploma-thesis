module.exports = ({
    icalendar,
    invitationTemplate,
    participantInvitationTemplate,
    calendarRepository,
    logger,
    sendOrQueueInterviewEmail,
    buildStorageAttachmentReference,
    formatting
}) => {
    const {
        formatInterviewDateTime,
        buildParticipantsDisplay,
        getOrganizerFromInterview,
        getApplicantFromInterview
    } = formatting;

    const sendInvitationToApplicant = async (interview) => {
        try {
            const { formattedDate, formattedTime } = formatInterviewDateTime(interview.scheduled_at);
            const organizer = getOrganizerFromInterview(interview);
            const applicant = getApplicantFromInterview(interview);
            const participantsDisplay = buildParticipantsDisplay(interview.participants);

            const icsContent = icalendar.generateInterviewICS(interview, applicant, organizer, interview.participants);
            const applicantEmailData = {
                applicantName: `${applicant.name} ${applicant.surname}`,
                interviewTitle: interview.title,
                formattedDate,
                formattedTime,
                duration: interview.duration_minutes,
                locationType: interview.location_type,
                location: interview.location || '',
                onlineMeetingLink: interview.online_meeting_link || '',
                participants: participantsDisplay,
                description: interview.description || '',
                notes: interview.notes || '',
                jobTitle: interview.job_title || '',
                organizationName: interview.organization_name
            };

            const { html: applicantHtml, text: applicantText } = invitationTemplate.generate(applicantEmailData);

            const dispatchResult = await sendOrQueueInterviewEmail({
                to: applicant.email,
                subject: `Pozvánka na pohovor - ${interview.organization_name}`,
                text: applicantText,
                html: applicantHtml,
                icalEvent: {
                    filename: 'pohovor.ics',
                    method: 'REQUEST',
                    content: icsContent
                },
                audit: {
                    action: 'email.interview.invitation.applicant',
                    resourceType: 'interview',
                    resourceId: interview.id,
                    organizationId: interview.organization_id || null
                }
            }, {
                interviewId: interview.id,
                organizationId: interview.organization_id || null
            });

            logger.info('Interview invitation sent to applicant', {
                interviewId: interview.id,
                applicantEmail: applicant.email,
                queued: dispatchResult.queued,
                outboxId: dispatchResult.outboxId
            });

            return { success: true, sentTo: applicant.email };
        } catch (error) {
            logger.error('Failed to send invitation to applicant', {
                error: error.message,
                interviewId: interview.id
            });
            throw error;
        }
    };

    const sendInvitationToParticipant = async (interview, participant) => {
        try {
            if (!participant.user_email) {
                throw new Error('Participant has no email address');
            }

            const { formattedDate, formattedTime } = formatInterviewDateTime(interview.scheduled_at);
            const organizer = getOrganizerFromInterview(interview);
            const applicant = getApplicantFromInterview(interview);
            const participantsDisplay = buildParticipantsDisplay(interview.participants);

            const icsContent = icalendar.generateInterviewICS(interview, applicant, organizer, interview.participants);
            const participantEmailData = {
                participantName: participant.user_name ? `${participant.user_name} ${participant.user_surname || ''}`.trim() : '',
                applicantName: `${applicant.name} ${applicant.surname}`,
                interviewTitle: interview.title,
                formattedDate,
                formattedTime,
                duration: interview.duration_minutes,
                locationType: interview.location_type,
                location: interview.location || '',
                onlineMeetingLink: interview.online_meeting_link || '',
                participants: participantsDisplay,
                description: interview.description || '',
                notes: interview.notes || '',
                jobTitle: interview.job_title || '',
                organizationName: interview.organization_name
            };

            const { html: participantHtml, text: participantText } = participantInvitationTemplate.generate(participantEmailData);
            const attachments = (await calendarRepository.getAttachments(interview.id))
                .map(buildStorageAttachmentReference);

            const dispatchResult = await sendOrQueueInterviewEmail({
                to: participant.user_email,
                subject: `Pohovor s uchazečem ${applicant.name} ${applicant.surname} - ${interview.organization_name}`,
                text: participantText,
                html: participantHtml,
                icalEvent: {
                    filename: 'pohovor.ics',
                    method: 'REQUEST',
                    content: icsContent
                },
                attachments,
                audit: {
                    action: 'email.interview.invitation.participant',
                    resourceType: 'interview',
                    resourceId: interview.id,
                    organizationId: interview.organization_id || null,
                    metadata: {
                        participantId: participant.id || null
                    }
                }
            }, {
                interviewId: interview.id,
                organizationId: interview.organization_id || null
            });

            logger.info('Interview invitation sent to participant', {
                interviewId: interview.id,
                participantEmail: participant.user_email,
                participantId: participant.id,
                queued: dispatchResult.queued,
                outboxId: dispatchResult.outboxId
            });

            return { success: true, sentTo: participant.user_email };
        } catch (error) {
            logger.error('Failed to send invitation to participant', {
                error: error.message,
                interviewId: interview.id,
                participantId: participant.id
            });
            throw error;
        }
    };

    const sendInvitationEmails = async (interview) => {
        try {
            await sendInvitationToApplicant(interview);

            for (const participant of interview.participants) {
                if (participant.user_email) {
                    try {
                        await sendInvitationToParticipant(interview, participant);
                    } catch (emailError) {
                        logger.error('Failed to send invitation to participant', {
                            error: emailError.message,
                            interviewId: interview.id,
                            participantEmail: participant.user_email
                        });
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to send invitation emails', {
                error: error.message,
                interviewId: interview.id
            });
            throw error;
        }
    };

    return {
        sendInvitationToApplicant,
        sendInvitationToParticipant,
        sendInvitationEmails
    };
};
