module.exports = ({
    employeesRepository,
    employeeDocumentPort,
    employeeOnboardingQueryPort,
    employeeOnboardingStepPort,
    ensureEmployeeAccess,
    employeeEvents,
    logger
}) => {
    const getEmployeeDocuments = async (employeeId, options = {}) => {
        return employeesRepository.getEmployeeDocuments(employeeId, options);
    };

    const getEmployeeOnboardingDashboard = async (employeeId, options = {}) => {
        await ensureEmployeeAccess(employeeId, options);
        return employeeOnboardingQueryPort.getDashboardDataForEmployee(employeeId);
    };

    const getEmployeeOnboardingSteps = async (employeeId, options = {}) => {
        await ensureEmployeeAccess(employeeId, options);
        return employeeOnboardingQueryPort.getOnboardingStepsForEmployee(employeeId);
    };

    const getEmployeeOnboardingProgress = async (employeeId, options = {}) => {
        await ensureEmployeeAccess(employeeId, options);
        return employeeOnboardingQueryPort.getProgressForEmployee(employeeId);
    };

    const getEmployeeOnboardingStepResponses = async (employeeId, stepId, options = {}) => {
        await ensureEmployeeAccess(employeeId, options);
        return employeeOnboardingStepPort.getStepDetailsForEmployee(stepId, employeeId);
    };

    const updateDocumentStatus = async (employeeId, documentId, status, notes = null, options = {}) => {
        let queuedUserNotificationEvent = null;

        const updatedDoc = await employeesRepository.updateDocumentStatus(
            employeeId,
            documentId,
            status,
            notes,
            {
                onBeforeCommit: async ({ client }) => {
                    queuedUserNotificationEvent = await employeeEvents.queueDocumentStatusNotification({
                        client,
                        employeeId,
                        documentId,
                        status
                    });
                }
            },
            options
        );

        if (queuedUserNotificationEvent) {
            logger.info('Queued employee document status notification', {
                employeeId,
                documentId,
                status,
                outboxId: queuedUserNotificationEvent.id
            });
        }

        return updatedDoc;
    };

    const getDocumentForDownload = async (employeeId, documentId, options = {}) => {
        return employeesRepository.getDocumentForDownload(employeeId, documentId, options);
    };

    const getEmployeeDocumentForDownload = async (employeeId, documentId, options = {}) => {
        await ensureEmployeeAccess(employeeId, options);
        return employeeDocumentPort.getEmployeeDocumentForDownload(employeeId, documentId, options);
    };

    const storeEmployeeDocument = async (employeeId, documentId, file, options = {}) => {
        await ensureEmployeeAccess(employeeId, {
            ...options,
            minAccess: options.minAccess || 'write'
        });
        return employeeDocumentPort.storeUserDocument(employeeId, documentId, file, options);
    };

    return {
        getEmployeeDocuments,
        getEmployeeOnboardingDashboard,
        getEmployeeOnboardingSteps,
        getEmployeeOnboardingProgress,
        getEmployeeOnboardingStepResponses,
        updateDocumentStatus,
        getDocumentForDownload,
        getEmployeeDocumentForDownload,
        storeEmployeeDocument
    };
};
