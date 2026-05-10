module.exports = ({ documentsService }) => {
    return {
        storeApplicantAttachment: documentsService.storeApplicantAttachment,
        getApplicantAttachmentForDownload: documentsService.getApplicantAttachmentForDownload,
        storeChatAttachment: documentsService.storeChatAttachment,
        getChatAttachmentForDownload: documentsService.getChatAttachmentForDownload,
        getFileStatistics: documentsService.getFileStatistics
    };
};
