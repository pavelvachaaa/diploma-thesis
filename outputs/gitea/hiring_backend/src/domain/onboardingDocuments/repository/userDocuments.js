module.exports = (core) => ({
    getUserDocuments: core.getUserDocuments,
    getUserDocumentById: core.getUserDocumentById,
    getUserDocumentForDownload: core.getUserDocumentForDownload,
    getEmployeeDocumentForDownload: core.getEmployeeDocumentForDownload,
    getUserOrganization: core.getUserOrganization,
    upsertUserDocument: core.upsertUserDocument,
    updateUserDocumentStatus: core.updateUserDocumentStatus,
    deleteUserDocument: core.deleteUserDocument
});
