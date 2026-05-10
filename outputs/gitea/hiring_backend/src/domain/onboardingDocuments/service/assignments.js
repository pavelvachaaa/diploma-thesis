module.exports = ({ onboardingDocumentsRepository }) => ({
    getDocumentsByJobRole: async (jobRoleId, options = {}) =>
        onboardingDocumentsRepository.getDocumentsByJobRole(jobRoleId, options),
    assignToJobRole: async (jobRoleId, documentId, isMandatory, options = {}) =>
        onboardingDocumentsRepository.assignToJobRole(jobRoleId, documentId, isMandatory, options),
    updateJobRoleAssignment: async (jobRoleId, documentId, isMandatory, options = {}) =>
        onboardingDocumentsRepository.updateJobRoleAssignment(jobRoleId, documentId, isMandatory, options),
    removeFromJobRole: async (jobRoleId, documentId, options = {}) =>
        onboardingDocumentsRepository.removeFromJobRole(jobRoleId, documentId, options),
    getWorkflowDocuments: async (workflowId, options = {}) =>
        onboardingDocumentsRepository.getWorkflowDocuments(workflowId, options),
    attachDocumentToWorkflow: async (workflowId, documentId, isMandatory, orderIndex, options = {}) =>
        onboardingDocumentsRepository.attachDocumentToWorkflow(workflowId, documentId, isMandatory, orderIndex, options),
    updateWorkflowDocumentAttachment: async (workflowId, documentId, updateData, options = {}) =>
        onboardingDocumentsRepository.updateWorkflowDocumentAttachment(workflowId, documentId, updateData, options),
    removeDocumentFromWorkflow: async (workflowId, documentId, options = {}) =>
        onboardingDocumentsRepository.removeDocumentFromWorkflow(workflowId, documentId, options),
    getStepDocuments: async (stepId, options = {}) =>
        onboardingDocumentsRepository.getStepDocuments(stepId, options),
    attachDocumentToStep: async (stepId, documentId, isMandatory, options = {}) =>
        onboardingDocumentsRepository.attachDocumentToStep(stepId, documentId, isMandatory, options),
    removeDocumentFromStep: async (stepId, documentId, options = {}) =>
        onboardingDocumentsRepository.removeDocumentFromStep(stepId, documentId, options),
    markDocumentAsRead: async (userId, stepId, documentId) =>
        onboardingDocumentsRepository.markDocumentAsRead(userId, stepId, documentId)
});
