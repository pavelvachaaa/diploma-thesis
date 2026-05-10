const { detectBucketFromKey } = require('./shared/storage');
const createDocumentsRepository = require('../repository');
const createDocumentsEvents = require('../events');
const createDownloads = require('./downloads');
const createApplicantAttachments = require('./applicantAttachments');
const createChatAttachments = require('./chatAttachments');
const createStats = require('./stats');

module.exports = ({
    db,
    logger,
    documentsRepository,
    documentsEvents,
    sideEffectOutboxService,
    fileGateway,
    cvIntentPort,
    transactionManager
}) => {
    const repository = documentsRepository || createDocumentsRepository({ db });
    const events = documentsEvents || createDocumentsEvents({ sideEffectOutboxService });

    const downloads = createDownloads({ documentsRepository: repository });
    const { getApplicantAttachmentForDownload, getApplicantAttachments } = downloads;

    const applicantAttachments = createApplicantAttachments({
        documentsRepository: repository,
        db,
        documentsEvents: events,
        logger,
        sideEffectOutboxService,
        fileGateway,
        detectBucketFromKey,
        cvIntentPort,
        transactionManager
    });

    const chatAttachments = createChatAttachments({
        documentsRepository: repository,
        fileGateway,
        logger
    });

    const stats = createStats({
        documentsRepository: repository,
        logger
    });

    return {
        detectBucketFromKey,
        getApplicantAttachments,
        getApplicantAttachmentForDownload,
        ...applicantAttachments,
        ...chatAttachments,
        ...stats
    };
};
