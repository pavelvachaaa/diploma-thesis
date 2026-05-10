const createTxRunner = require('@platform/transaction/createTxRunner');
const createReadRepository = require('./core/reads');
const createWriteRepository = require('./core/writes');

module.exports = ({ db, transactionManager }) => {
    const getExecutor = (options = {}) => options.client || db;
    const { runInTransaction } = createTxRunner({
        db,
        transactionManager,
        defaultLabel: 'employees.repository'
    });

    return {
        ...createReadRepository({
            db,
            getExecutor
        }),
        ...createWriteRepository({
            db,
            runInTransaction
        })
    };
};
