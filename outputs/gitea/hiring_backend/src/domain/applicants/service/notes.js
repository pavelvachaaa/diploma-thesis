const createNoteQueries = require('./noteQueries');
const createNoteMutations = require('./noteMutations');

module.exports = (deps) => ({
    ...createNoteQueries(deps),
    ...createNoteMutations(deps)
});
