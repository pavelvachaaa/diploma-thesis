/**
 * @typedef {Object} InternalUserProvisioningPort
 * @property {(personInput: Object, txOptions?: Object) => Promise<Object>} ensureLocalUser
 */

module.exports = Object.freeze({
    portName: 'InternalUserProvisioningPort',
    methods: Object.freeze([
        'ensureLocalUser'
    ])
});
