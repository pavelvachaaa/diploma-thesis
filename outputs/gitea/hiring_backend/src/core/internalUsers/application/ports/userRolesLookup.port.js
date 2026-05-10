/**
 * @typedef {Object} UserRolesLookupPort
 * @property {(userId: string, options?: Object) => Promise<string[]>} getUserRoles
 */

module.exports = Object.freeze({
    portName: 'UserRolesLookupPort',
    methods: Object.freeze([
        'getUserRoles'
    ])
});
