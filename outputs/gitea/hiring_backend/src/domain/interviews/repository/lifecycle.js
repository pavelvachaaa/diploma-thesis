const createTxRunner = require('@shared/transaction/createTxRunner');
const createCreateRepository = require('./create');
const createUpdatesRepository = require('./updates');
const createStatusTransitionsRepository = require('./statusTransitions');
const {
    ACCESS_LEVELS,
    addInterviewPermissionExists,
    addInterviewPermissionJoin
} = require('./shared');

module.exports = ({ db, logger, transactionManager }) => {
    const { runInTransaction } = createTxRunner({
        db,
        transactionManager,
        logger,
        defaultLabel: 'interviews.repository.lifecycle'
    });

    const shared = {
        db,
        logger,
        runInTransaction,
        ACCESS_LEVELS,
        addInterviewPermissionExists,
        addInterviewPermissionJoin
    };

    return {
        ...createCreateRepository(shared),
        ...createUpdatesRepository(shared),
        ...createStatusTransitionsRepository(shared)
    };
};
