const createShared = require('./attachments.shared');
const createReads = require('./attachments.reads');
const createMutations = require('./attachments.mutations');

module.exports = ({ db }) => {
    const shared = createShared({ db });

    return {
        ...createReads({
            db,
            ...shared
        }),
        ...createMutations(shared)
    };
};
