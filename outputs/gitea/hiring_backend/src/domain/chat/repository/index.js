const createShared = require('./shared');
const createMessages = require('./messages');
const createThreads = require('./threads');
const createDirectory = require('./directory');

module.exports = (deps) => {
    const shared = createShared(deps);

    return {
        ...createMessages(shared),
        ...createThreads(shared),
        ...createDirectory(shared),
        withTransaction: shared.withTransaction
    };
};
