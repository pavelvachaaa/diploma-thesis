module.exports = ({ documentsRepository, logger }) => {
    const getFileStatistics = async () => {
        const stats = {
            userDocuments: { count: 0, totalSize: 0 },
            applicantAttachments: { count: 0, totalSize: 0 },
            onboardingTemplates: { count: 0, totalSize: 0 }
        };

        try {
            stats.userDocuments = await documentsRepository.getUserDocumentStats();
            stats.applicantAttachments = await documentsRepository.getApplicantAttachmentStats();
            stats.onboardingTemplates = await documentsRepository.getOnboardingTemplateStats();

            return stats;
        } catch (error) {
            logger.error('Failed to get file statistics', { error: error.message });
            throw error;
        }
    };

    return {
        getFileStatistics
    };
};
