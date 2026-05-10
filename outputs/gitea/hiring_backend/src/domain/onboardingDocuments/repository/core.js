const createTxRunner = require('@platform/transaction/createTxRunner');
const {
    DOCUMENT_SELECT_FIELDS,
    USER_DOCUMENT_SELECT_FIELDS,
    buildDocumentFilters,
    buildDocumentAccessCondition
} = require('./queryBuilders');
const createDocumentCatalog = require('./core/documentCatalog');
const createAssignments = require('./core/assignments');
const createUserDocuments = require('./core/userDocuments');
const createDownloads = require('./core/downloads');

module.exports = ({ db, transactionManager }) => {
    const getExecutor = (options = {}) => options.client || db;
    const { runInTransaction } = createTxRunner({
        db,
        transactionManager,
        defaultLabel: 'onboardingDocuments.repository'
    });

    const withTransaction = (callback, options = {}) => runInTransaction((client) => callback(client), options);

    const shared = {
        db,
        getExecutor,
        withTransaction,
        DOCUMENT_SELECT_FIELDS,
        USER_DOCUMENT_SELECT_FIELDS,
        buildDocumentFilters,
        buildDocumentAccessCondition
    };

    const catalog = createDocumentCatalog(shared);

    return {
        withTransaction,
        ...catalog,
        delete: catalog.deleteOne,
        ...createAssignments(shared),
        ...createUserDocuments(shared),
        ...createDownloads(shared)
    };
};
