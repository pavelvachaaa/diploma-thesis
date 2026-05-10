/**
 * @typedef {Object} NotificationUrlResolverPort
 * @property {(recipientUserId: string, type: string, data?: Object) => Promise<string|null>} generateNotificationUrl
 */

module.exports = Object.freeze({
    portName: 'NotificationUrlResolverPort',
    methods: Object.freeze([
        'generateNotificationUrl'
    ])
});
