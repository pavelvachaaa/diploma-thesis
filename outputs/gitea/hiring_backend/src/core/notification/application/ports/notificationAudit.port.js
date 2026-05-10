/**
 * @typedef {Object} NotificationAuditPort
 * @property {(event: Object) => void} recordUserNotificationCreated
 * @property {(event: Object) => void} recordRoleBroadcastSent
 * @property {(event: Object) => void} recordPreferencesUpdated
 * @property {(event: Object) => void} recordTypePreferencesUpdated
 * @property {(event: Object) => void} recordAllNotificationsRead
 */

module.exports = Object.freeze({
    portName: 'NotificationAuditPort',
    methods: Object.freeze([
        'recordUserNotificationCreated',
        'recordRoleBroadcastSent',
        'recordPreferencesUpdated',
        'recordTypePreferencesUpdated',
        'recordAllNotificationsRead'
    ])
});
