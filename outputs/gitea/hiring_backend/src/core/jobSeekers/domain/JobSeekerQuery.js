const { normalizePreferredPositionKey } = require('./preferredPosition');

const normalizeListOptions = (options = {}) => Object.freeze({
    ...options,
    preferredPositionKey: normalizePreferredPositionKey(options.preferredPosition || options.preferredPositionKey) || ''
});

module.exports = Object.freeze({
    normalizeListOptions
});
