module.exports = (core) => ({
    getDocumentsByJobRole: core.getDocumentsByJobRole,
    assignToJobRole: core.assignToJobRole,
    updateJobRoleAssignment: core.updateJobRoleAssignment,
    removeFromJobRole: core.removeFromJobRole,
    getWorkflowDocuments: core.getWorkflowDocuments,
    attachDocumentToWorkflow: core.attachDocumentToWorkflow,
    updateWorkflowDocumentAttachment: core.updateWorkflowDocumentAttachment,
    removeDocumentFromWorkflow: core.removeDocumentFromWorkflow,
    getStepDocuments: core.getStepDocuments,
    attachDocumentToStep: core.attachDocumentToStep,
    markDocumentAsRead: core.markDocumentAsRead,
    removeDocumentFromStep: core.removeDocumentFromStep
});
