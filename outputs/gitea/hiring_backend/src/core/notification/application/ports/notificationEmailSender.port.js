/**
 * @typedef {Object} NotificationEmailSenderPort
 * @property {(payload: Object) => Promise<Object>} sendNotificationEmail
 */

module.exports = Object.freeze({
    portName: 'NotificationEmailSenderPort',
    methods: Object.freeze([
        'sendNotificationEmail'
    ])
});
