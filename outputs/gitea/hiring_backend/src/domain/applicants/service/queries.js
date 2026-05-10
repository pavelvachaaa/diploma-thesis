module.exports = ({ applicantsRepository, statusRepository, attachmentsRepository }) => {
    const getAllApplicants = (...args) => {
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
            return applicantsRepository.getAllApplicants(args[0]);
        }

        const [page, limit, organizationId, search, status, organizationName = ''] = args;
        return applicantsRepository.getAllApplicants({
            page,
            limit,
            organizationId,
            search,
            status,
            organizationName
        });
    };

    const getApplicantsByJobId = (jobId, options = {}) => applicantsRepository.getApplicantsByJobId(jobId, options);
    const getApplicantById = (id, options = {}) => applicantsRepository.getApplicantById(id, options);

    const getApplicantStatusHistory = (applicantId, options = {}) => statusRepository.getStatusHistoryByApplicantId(applicantId, options);
    const getAllStatuses = () => statusRepository.getAllStatuses();

    const getAttachmentsByApplicantId = async (applicantId, options = {}) => attachmentsRepository.getByApplicantId(applicantId, options);
    const getAttachmentById = async (id, options = {}) => attachmentsRepository.getById(id, options);

    const getAllDocumentStatuses = async () => attachmentsRepository.getAllStatuses();

    return {
        getAllApplicants,
        getApplicantsByJobId,
        getApplicantById,
        getApplicantStatusHistory,
        getAllStatuses,
        getAttachmentsByApplicantId,
        getAttachmentById,
        getAllDocumentStatuses
    };
};
