module.exports = ({
    calendarRepository,
    runtimeSupport,
    auditSupport,
    interviewNotifications
}) => {
    const cancelInterview = async (id, reason, cancelledBy, options = {}) => {
        try {
            const { sendNotification = true, customEmailBody } = options;
            const interview = await calendarRepository.getById(id, options);

            if (!interview) {
                return null;
            }

            const cancelled = await calendarRepository.cancel(id, reason, cancelledBy, options);
            if (!cancelled) {
                return null;
            }

            const cancelledInterview = await calendarRepository.getById(id, options);

            auditSupport.emitAudit({
                category: 'interview',
                action: 'interview.cancel',
                status: 'success',
                resourceType: 'interview',
                resourceId: id,
                organizationId: interview.organization_id || null,
                beforeState: auditSupport.createInterviewSnapshot(interview),
                afterState: auditSupport.createInterviewSnapshot(cancelledInterview || cancelled),
                metadata: {
                    reason: reason || null,
                    cancelledBy: cancelledBy || null,
                    sendNotification
                }
            });

            runtimeSupport.runBestEffort({
                action: 'Failed to enqueue interview.cancelled notification intent',
                interviewId: id,
                task: async () => {
                    await interviewNotifications.enqueueInterviewCancelledRoleNotification(interview);
                }
            });

            if (sendNotification) {
                runtimeSupport.runBestEffort({
                    action: 'Failed to send cancellation notifications',
                    interviewId: id,
                    task: async () => {
                        await interviewNotifications.sendCancellationNotifications(interview, reason, customEmailBody);
                    }
                });
            }

            return cancelled;
        } catch (error) {
            runtimeSupport.logger.error('Failed to cancel interview', {
                error: error.message,
                interviewId: id
            });
            throw error;
        }
    };

    return {
        cancelInterview
    };
};
