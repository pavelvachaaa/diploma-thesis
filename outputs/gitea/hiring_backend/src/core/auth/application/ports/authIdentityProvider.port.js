/**
 * @typedef {Object} AuthIdentityProviderPort
 * @property {(idToken: string) => Object|null} decodeIdTokenClaims
 * @property {(payload: Object) => Promise<Object>} exchangeAuthorizationCode
 * @property {(payload: Object) => Promise<Object>} fetchUcpUserInfo
 * @property {(payload: Object) => Promise<Object>} verifyCiscoToken
 */

module.exports = Object.freeze({
    portName: 'AuthIdentityProviderPort',
    methods: Object.freeze([
        'decodeIdTokenClaims',
        'exchangeAuthorizationCode',
        'fetchUcpUserInfo',
        'verifyCiscoToken'
    ])
});
