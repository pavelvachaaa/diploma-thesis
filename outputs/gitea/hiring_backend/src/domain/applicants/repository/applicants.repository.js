const createShared = require('./applicants.shared');
const createWrites = require('./applicants.writes');
const createReads = require('./applicants.reads');
const createListing = require('./applicants.listing');

module.exports = ({ db }) => {
    const shared = createShared({ db });

    return {
        ...createWrites(shared),
        ...createReads({
            db,
            ...shared
        }),
        ...createListing({
            db,
            ...shared
        })
    };
};
