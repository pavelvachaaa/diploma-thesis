module.exports = ({
    calendarRepository,
    runtimeSupport,
    auditSupport,
    resendNotifications
}) => {
    const resendInvitation = async (interviewId, options, authOptions = {}) => {
        const { target, participantId } = options;
        let interview = null;

        try {
            interview = await calendarRepository.getById(interviewId, authOptions);

            if (!interview) {
                throw new Error('Interview not found');
            }

            if (interview.status === 'cancelled') {
                throw new Error('Cannot resend invitation for cancelled interview');
            }

            if (target === 'applicant') {
                await resendNotifications.sendInvitationToApplicant(interview);

                runtimeSupport.logger.info('Invitation resent to applicant', {
                    interviewId,
                    applicantEmail: interview.applicant_email
                });

                auditSupport.emitAudit({
                    category: 'interview',
                    action: 'interview.invitation.resend',
                    status: 'success',
                    resourceType: 'interview',
                    resourceId: interviewId,
                    organizationId: interview.organization_id || null,
                    metadata: {
                        target: 'applicant',
                        sentTo: interview.applicant_email || null
                    }
                });

                return {
                    success: true,
                    message: 'Invitation resent to applicant',
                    sentTo: interview.applicant_email
                };
            }

            if (target === 'participant') {
                if (!participantId) {
                    throw new Error('participantId is required when target is participant');
                }

                const participant = interview.participants.find((candidate) => candidate.id === participantId);

                if (!participant) {
                    throw new Error('Participant not found in this interview');
                }

                if (!participant.user_email) {
                    throw new Error('Participant has no email address');
                }

                await resendNotifications.sendInvitationToParticipant(interview, participant);

                runtimeSupport.logger.info('Invitation resent to participant', {
                    interviewId,
                    participantId,
                    participantEmail: participant.user_email
                });

                auditSupport.emitAudit({
                    category: 'interview',
                    action: 'interview.invitation.resend',
                    status: 'success',
                    resourceType: 'interview',
                    resourceId: interviewId,
                    organizationId: interview.organization_id || null,
                    metadata: {
                        target: 'participant',
                        participantId,
                        sentTo: participant.user_email || null
                    }
                });

                return {
                    success: true,
                    message: 'Invitation resent to participant',
                    sentTo: participant.user_email
                };
            }

            throw new Error('Invalid target. Must be "applicant" or "participant"');
        } catch (error) {
            auditSupport.emitAudit({
                category: 'interview',
                action: 'interview.invitation.resend',
                status: 'failure',
                resourceType: 'interview',
                resourceId: interviewId,
                organizationId: interview?.organization_id || null,
                errorMessage: error.message,
                metadata: {
                    target: target || null,
                    participantId: participantId || null
                }
            });
            throw error;
        }
    };

    return {
        resendInvitation
    };
};
