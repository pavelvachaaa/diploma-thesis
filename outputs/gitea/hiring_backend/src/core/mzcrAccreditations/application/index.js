const createSyncMzcrAccreditations = require('./syncMzcrAccreditations');
const createGetMzcrAccreditationSyncState = require('./getMzcrAccreditationSyncState');
const createListMzcrAccreditations = require('./listMzcrAccreditations');
const createGetMzcrAccreditationMeta = require('./getMzcrAccreditationMeta');

module.exports = (dependencies, options = {}) => ({
    syncMzcrAccreditations: createSyncMzcrAccreditations(dependencies, options),
    getMzcrAccreditationSyncState: createGetMzcrAccreditationSyncState(dependencies),
    listMzcrAccreditations: createListMzcrAccreditations(dependencies),
    getMzcrAccreditationMeta: createGetMzcrAccreditationMeta(dependencies)
});
