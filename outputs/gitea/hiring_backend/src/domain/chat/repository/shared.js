const createTxRunner = require('@platform/transaction/createTxRunner');

module.exports = ({ db, transactionManager }) => {
    const getExecutor = (options = {}) => options.client || db;

    const { runInTransaction } = createTxRunner({
        db,
        transactionManager,
        defaultLabel: 'chat.sendMessage'
    });

    const withTransaction = (callback) => runInTransaction((client) => callback(client));

    const getConversationPair = (currentUserId, withUserId) => ({
        convoA: currentUserId < withUserId ? currentUserId : withUserId,
        convoB: currentUserId > withUserId ? currentUserId : withUserId
    });

    return {
        db,
        getExecutor,
        withTransaction,
        getConversationPair
    };
};
