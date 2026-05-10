const createApplicantCreation = require('./createApplicant');
const createStatusTransitions = require('./statusTransitions');

module.exports = (deps) => ({
    ...createApplicantCreation(deps),
    ...createStatusTransitions(deps)
});
