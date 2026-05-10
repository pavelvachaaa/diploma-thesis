module.exports = ({
    calendarRepository,
    runtimeSupport,
    auditSupport,
    interviewNotifications
}) => {
    const updateInterview = async (id, data, updatedBy, options = {}) => {
        try {
            const beforeInterview = await calendarRepository.getById(id, options);
            if (!beforeInterview) {
                return null;
            }

            const updated = await calendarRepository.update(id, data, options);
            if (!updated) {
                return null;
            }

            const fullInterview = await calendarRepository.getById(id, options);
            const beforeState = auditSupport.createInterviewSnapshot(beforeInterview);
            const afterState = auditSupport.createInterviewSnapshot(fullInterview);

            auditSupport.emitAudit({
                category: 'interview',
                action: 'interview.update',
                status: 'success',
                resourceType: 'interview',
                resourceId: id,
                organizationId: fullInterview?.organization_id || beforeInterview?.organization_id || null,
                beforeState,
                afterState,
                metadata: {
                    updatedBy: updatedBy || null,
                    changedFields: auditSupport.getChangedFields(beforeState, afterState)
                }
            });

            runtimeSupport.runBestEffort({
                action: 'Failed to send update notifications',
                interviewId: id,
                task: async () => {
                    await interviewNotifications.sendUpdateNotifications(fullInterview);
                }
            });

            return fullInterview;
        } catch (error) {
            runtimeSupport.logger.error('Failed to update interview', {
                error: error.message,
                interviewId: id
            });
            throw error;
        }
    };

    return {
        updateInterview
    };
};
