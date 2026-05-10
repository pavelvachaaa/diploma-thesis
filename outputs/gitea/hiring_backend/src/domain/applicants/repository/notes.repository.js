const createShared = require('./notes.shared');
const createReads = require('./notes.reads');
const createMutations = require('./notes.mutations');

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
