module.exports = ({ db }) => ({
    getExecutor: (options = {}) => options.client || db
});
