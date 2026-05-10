const createTxRunner = require('@platform/transaction/createTxRunner');

module.exports = ({ db, logger }) => {
    return createTxRunner({
        db,
        logger,
        defaultLabel: 'transaction'
    });
};
