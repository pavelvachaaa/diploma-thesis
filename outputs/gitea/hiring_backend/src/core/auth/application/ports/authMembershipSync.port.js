/**
 * @typedef {Object} AuthMembershipSyncPort
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} queueMembershipSync
 */

module.exports = Object.freeze({
    portName: 'AuthMembershipSyncPort',
    methods: Object.freeze([
        'queueMembershipSync'
    ])
});
