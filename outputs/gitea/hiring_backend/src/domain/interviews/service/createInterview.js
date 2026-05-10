module.exports = ({
    calendarRepository,
    applicantDocumentsQueryPort,
    applicantsStatusCommandPort,
    runtimeSupport,
    auditSupport,
    interviewNotifications
}) => {
    const createInterview = async (data, participantsList = [], options = {}) => {
        try {
            const interview = await calendarRepository.create(data, participantsList);

            await calendarRepository.addParticipant(interview.id, {
                user_id: data.created_by,
                external_email: null,
                external_name: null,
                role: 'organizer'
            }, options);

            const applicantAttachments = await applicantDocumentsQueryPort.getApplicantAttachments(data.applicant_id);
            for (const attachment of applicantAttachments) {
                await calendarRepository.addAttachment(interview.id, {
                    file_id: attachment.file_id,
                    uploaded_by: data.created_by
                }, options);
            }

            const fullInterview = await calendarRepository.getById(interview.id, options);

            await applicantsStatusCommandPort.updateApplicantStatus(
                fullInterview.applicant_id,
                'interview_scheduled',
                fullInterview.created_by
            );

            auditSupport.emitAudit({
                category: 'interview',
                action: 'interview.create',
                status: 'success',
                resourceType: 'interview',
                resourceId: fullInterview.id,
                organizationId: fullInterview.organization_id || null,
                beforeState: null,
                afterState: auditSupport.createInterviewSnapshot(fullInterview),
                metadata: {
                    participantCount: Array.isArray(fullInterview.participants) ? fullInterview.participants.length : 0,
                    attachmentCount: Array.isArray(fullInterview.attachments) ? fullInterview.attachments.length : 0
                }
            });

            runtimeSupport.runBestEffort({
                action: 'Failed to enqueue interview.scheduled notification intents',
                interviewId: fullInterview.id,
                task: async () => {
                    await interviewNotifications.enqueueInterviewScheduledRoleNotification(fullInterview);
                    await interviewNotifications.notifyParticipants(fullInterview.participants, fullInterview, fullInterview.created_by);
                }
            });

            runtimeSupport.runBestEffort({
                action: 'Failed to send invitation emails',
                interviewId: interview.id,
                task: async () => {
                    await interviewNotifications.sendInvitationEmails(fullInterview);
                }
            });

            return fullInterview;
        } catch (error) {
            runtimeSupport.logger.error('Failed to create interview', {
                error: error.message,
                data
            });
            throw error;
        }
    };

    return {
        createInterview
    };
};
