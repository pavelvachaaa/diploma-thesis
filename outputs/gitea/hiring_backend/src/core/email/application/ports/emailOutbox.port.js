/**
 * @typedef {Object} EmailOutboxPort
 * @property {(payload: Object, options?: Object) => Promise<Object>} enqueueRawEmail
 * @property {(payload: Object, options?: Object) => Promise<Object>} enqueueWelcomeEmail
 * @property {() => boolean} isEnabled
 * @property {() => Object} getHealthStatus
 */

module.exports = Object.freeze({
    portName: 'EmailOutboxPort',
    methods: Object.freeze([
        'enqueueRawEmail',
        'enqueueWelcomeEmail',
        'isEnabled',
        'getHealthStatus'
    ])
});
