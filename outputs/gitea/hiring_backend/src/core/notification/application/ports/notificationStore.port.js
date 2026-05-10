/**
 * @typedef {Object} NotificationStorePort
 * @property {(data: Object, options?: Object) => Promise<Object>} insertNotification
 * @property {(query: Object, options?: Object) => Promise<Object[]>} listByUser
 * @property {(userId: string, options?: Object) => Promise<number>} unreadCount
 * @property {(id: string, userId: string, options?: Object) => Promise<boolean>} markRead
 * @property {(userId: string, options?: Object) => Promise<number>} markAllRead
 * @property {(organizationId: string, roleName: string|string[], options?: Object) => Promise<string[]>} getUsersByRoleInOrganization
 * @property {(userId: string, options?: Object) => Promise<Object>} getPreferences
 * @property {(userId: string, preferences: Object, options?: Object) => Promise<Object>} updatePreferences
 * @property {(userId: string, typeCode: string, options?: Object) => Promise<Object>} getTypePreferences
 * @property {(userId: string, typeCode: string, preferences: Object, options?: Object) => Promise<Object>} updateTypePreferences
 */

module.exports = Object.freeze({
    portName: 'NotificationStorePort',
    methods: Object.freeze([
        'insertNotification',
        'listByUser',
        'unreadCount',
        'markRead',
        'markAllRead',
        'getUsersByRoleInOrganization',
        'getPreferences',
        'updatePreferences',
        'getTypePreferences',
        'updateTypePreferences'
    ])
});
