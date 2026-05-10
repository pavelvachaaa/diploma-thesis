const createTxRunner = require('@platform/transaction/createTxRunner');

module.exports = ({ db, transactionManager }) => createTxRunner({
    db,
    transactionManager,
    defaultLabel: 'applicants.lifecycle'
});
