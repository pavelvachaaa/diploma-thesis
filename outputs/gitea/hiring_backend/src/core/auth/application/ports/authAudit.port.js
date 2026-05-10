/**
 * @typedef {Object} AuthAuditPort
 * @property {(event: Object) => void} emitAuthEvent
 */

module.exports = Object.freeze({
    portName: 'AuthAuditPort',
    methods: Object.freeze([
        'emitAuthEvent'
    ])
});
