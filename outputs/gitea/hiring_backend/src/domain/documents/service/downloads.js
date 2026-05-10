module.exports = ({ documentsRepository }) => {
    const getApplicantAttachmentForDownload = async (attachmentId) => {
        return documentsRepository.getApplicantAttachmentForDownload(attachmentId);
    };

    const getApplicantAttachments = async (applicantId) => {
        return documentsRepository.getApplicantAttachments(applicantId);
    };

    return {
        getApplicantAttachmentForDownload,
        getApplicantAttachments
    };
};
