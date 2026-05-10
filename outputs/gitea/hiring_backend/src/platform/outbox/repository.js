const createQueueRepository = require('./repository/queue');
const createInspectionRepository = require('./repository/inspect');
const createReplayRepository = require('./repository/replay');
const {
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT,
    toPositiveInt,
    buildFilterClauses,
    buildReplaySelection
} = require('./repository/utils');

module.exports = ({ db }) => {
    const getExecutor = (options = {}) => options.client || db;

    return {
        ...createQueueRepository({
            db,
            getExecutor
        }),
        ...createInspectionRepository({
            db,
            buildFilterClauses,
            toPositiveInt,
            DEFAULT_LIST_LIMIT,
            MAX_LIST_LIMIT
        }),
        ...createReplayRepository({
            db,
            buildReplaySelection
        })
    };
};
