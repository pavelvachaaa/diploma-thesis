const createCreateInterview = require('./createInterview');
const createUpdateInterview = require('./updateInterview');
const createCancelInterview = require('./cancelInterview');

module.exports = (deps) => ({
    ...createCreateInterview(deps),
    ...createUpdateInterview(deps),
    ...createCancelInterview(deps)
});
