/**
 * @typedef {Object} AuthUserStorePort
 * @property {(email: string, options?: Object) => Promise<Object|null>} findByEmailAndProvider
 * @property {(userId: string, options?: Object) => Promise<string[]>} getUserRoles
 * @property {(userData: Object, options?: Object) => Promise<{user: Object, membership: Object|null}>} createOAuthUser
 * @property {(userId: string, oauthData: Object, options?: Object) => Promise<Object|null>} updateUserFromOAuth
 * @property {(userId: string, options?: Object) => Promise<Object|null>} findById
 * @property {(userId: string, passwordHash: string, options?: Object) => Promise<Object|null>} updateUserPassword
 * @property {(userId: string, options?: Object) => Promise<Object|null>} getUserWithRoles
 */

module.exports = Object.freeze({
    portName: 'AuthUserStorePort',
    methods: Object.freeze([
        'findByEmailAndProvider',
        'getUserRoles',
        'createOAuthUser',
        'updateUserFromOAuth',
        'findById',
        'updateUserPassword',
        'getUserWithRoles'
    ])
});
