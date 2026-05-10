module.exports = ({
    icalendar,
    cancellationTemplate,
    participantCancellationTemplate,
    logger,
    sendOrQueueInterviewEmail,
    formatting
}) => {
    const {
        formatInterviewDateTime,
        getOrganizerFromInterview,
        getApplicantFromInterview
    } = formatting;

    const sendCancellationNotifications = async (interview, reason, customEmailBody) => {
        try {
            const { formattedDate, formattedTime } = formatInterviewDateTime(interview.scheduled_at);
            const organizer = getOrganizerFromInterview(interview);
            const applicant = getApplicantFromInterview(interview);

            const cancellationICS = icalendar.generateCancellationICS(interview, applicant, organizer, interview.participants);

            const applicantEmailData = {
                applicantName: `${applicant.name} ${applicant.surname}`,
                interviewTitle: interview.title,
                formattedDate,
                formattedTime,
                location: interview.location || '',
                cancellationReason: reason || '',
                organizationName: interview.organization_name
            };

            let applicantHtml;
            let applicantText;
            if (customEmailBody) {
                applicantHtml = `<p>${customEmailBody.replace(/\n/g, '<br>')}</p>`;
                applicantText = customEmailBody;
            } else {
                ({ html: applicantHtml, text: applicantText } = cancellationTemplate.generate(applicantEmailData));
            }

            const applicantDispatch = await sendOrQueueInterviewEmail({
                to: applicant.email,
                subject: `Zrušení pohovoru - ${interview.organization_name}`,
                text: applicantText,
                html: applicantHtml,
                icalEvent: {
                    filename: 'pohovor-zruseni.ics',
                    method: 'CANCEL',
                    content: cancellationICS
                },
                audit: {
                    action: 'email.interview.cancellation.applicant',
                    resourceType: 'interview',
                    resourceId: interview.id,
                    organizationId: interview.organization_id || null
                }
            }, {
                interviewId: interview.id,
                organizationId: interview.organization_id || null
            });

            logger.info('Interview cancellation notification sent to applicant', {
                interviewId: interview.id,
                applicantEmail: applicant.email,
                queued: applicantDispatch.queued,
                outboxId: applicantDispatch.outboxId
            });

            for (const participant of interview.participants) {
                if (participant.user_email) {
                    try {
                        const participantEmailData = {
                            participantName: participant.user_name ? `${participant.user_name} ${participant.user_surname || ''}`.trim() : '',
                            applicantName: `${applicant.name} ${applicant.surname}`,
                            interviewTitle: interview.title,
                            formattedDate,
                            formattedTime,
                            location: interview.location || '',
                            cancellationReason: reason || '',
                            organizationName: interview.organization_name
                        };

                        const { html: participantHtml, text: participantText } = participantCancellationTemplate.generate(participantEmailData);

                        const participantDispatch = await sendOrQueueInterviewEmail({
                            to: participant.user_email,
                            subject: `Zrušení pohovoru s ${applicant.name} ${applicant.surname} - ${interview.organization_name}`,
                            text: participantText,
                            html: participantHtml,
                            icalEvent: {
                                filename: 'pohovor-zruseni.ics',
                                method: 'CANCEL',
                                content: cancellationICS
                            },
                            audit: {
                                action: 'email.interview.cancellation.participant',
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

                        logger.info('Interview cancellation notification sent to participant', {
                            interviewId: interview.id,
                            participantEmail: participant.user_email,
                            queued: participantDispatch.queued,
                            outboxId: participantDispatch.outboxId
                        });
                    } catch (emailError) {
                        logger.error('Failed to send cancellation to participant', {
                            error: emailError.message,
                            interviewId: interview.id,
                            participantEmail: participant.user_email
                        });
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to send cancellation notifications', {
                error: error.message,
                interviewId: interview.id
            });
            throw error;
        }
    };

    return {
        sendCancellationNotifications
    };
};
