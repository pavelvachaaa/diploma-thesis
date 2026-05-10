/**
 * @typedef {Object} InternalUsersStorePort
 * @property {(email: string, options?: Object) => Promise<Object|null>} findLocalUserByEmail
 * @property {(emails: string[], options?: Object) => Promise<Object[]>} findLocalUsersByEmails
 * @property {(seatLocation: string, options?: Object) => Promise<Object|null>} getOrganizationBySeatLocation
 * @property {(seatLocations: string[], options?: Object) => Promise<Object[]>} getOrganizationsBySeatLocations
 * @property {(userData: Object, options?: Object) => Promise<Object|null>} createLocalInternalUser
 * @property {(userId: string, profile: Object, options?: Object) => Promise<Object|null>} updateLocalUserProfile
 */

module.exports = Object.freeze({
    portName: 'InternalUsersStorePort',
    methods: Object.freeze([
        'findLocalUserByEmail',
        'findLocalUsersByEmails',
        'getOrganizationBySeatLocation',
        'getOrganizationsBySeatLocations',
        'createLocalInternalUser',
        'updateLocalUserProfile'
    ])
});
