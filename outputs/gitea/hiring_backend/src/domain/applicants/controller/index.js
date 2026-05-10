const createPublicHandlers = require('./publicHandlers');
const createAdminLifecycleHandlers = require('./adminLifecycle');
const createAdminNotesHandlers = require('./adminNotes');
const createAdminDocumentsHandlers = require('./adminDocuments');
const createAdminCommunicationHandlers = require('./adminCommunication');
const createAttachmentHelpers = require('./shared/attachments');
const createIdempotentWriteHelpers = require('./shared/idempotentWrite');

const applicantContracts = require('@shared/contracts/applicants');

module.exports = (deps) => {
    const {
        applicantsService,
        jobsService,
        documentsService,
        fileDownload,
        jobSeekersAccessPort,
        logger
    } = deps;

    const idempotentWrite = createIdempotentWriteHelpers(deps);
    const attachmentHelpers = createAttachmentHelpers({
        documentsService,
        applicantContracts,
        jobSeekersAccessPort
    });

    return {
        ...createPublicHandlers({
            applicantsService,
            jobsService,
            fileDownload,
            applicantContracts,
            attachmentHelpers,
            idempotentWrite
        }),
        ...createAdminLifecycleHandlers({
            applicantsService,
            applicantContracts,
            attachmentHelpers,
            idempotentWrite
        }),
        ...createAdminNotesHandlers({
            applicantsService
        }),
        ...createAdminDocumentsHandlers({
            applicantsService,
            documentsService,
            fileDownload,
            logger
        }),
        ...createAdminCommunicationHandlers({
            applicantsService,
            logger
        })
    };
};
