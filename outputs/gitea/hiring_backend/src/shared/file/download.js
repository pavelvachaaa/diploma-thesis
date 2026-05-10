const {
    detectBucketFromKey
} = require('./download/keyResolution');
const {
    resolveOriginalName,
    buildContentDispositionHeader
} = require('./download/contentDisposition');
const createAudit = require('./download/audit');
const createTransfer = require('./download/transfer');

module.exports = ({ logger, storageService, audit }) => {
    const { emitSeaweedReadAudit, resolveErrorStatusCode } = createAudit({ audit });

    return createTransfer({
        logger,
        storageService,
        detectBucketFromKey,
        resolveOriginalName,
        buildContentDispositionHeader,
        emitSeaweedReadAudit,
        resolveErrorStatusCode
    });
};
