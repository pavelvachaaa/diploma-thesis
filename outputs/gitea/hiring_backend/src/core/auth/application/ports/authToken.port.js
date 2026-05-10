/**
 * @typedef {Object} AuthTokenPort
 * @property {(payload: Object) => string} signToken
 * @property {(token: string) => Object} verifyToken
 */

module.exports = Object.freeze({
    portName: 'AuthTokenPort',
    methods: Object.freeze([
        'signToken',
        'verifyToken'
    ])
});
