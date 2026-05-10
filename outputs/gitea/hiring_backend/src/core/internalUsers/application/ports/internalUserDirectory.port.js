/**
 * @typedef {Object} InternalUserDirectoryPort
 * @property {(payload: { query: string }) => Promise<Object[]>} searchUsers
 */

module.exports = Object.freeze({
    portName: 'InternalUserDirectoryPort',
    methods: Object.freeze([
        'searchUsers'
    ])
});
