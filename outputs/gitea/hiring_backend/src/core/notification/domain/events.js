/**
 * Domain Events for the Notification bounded context.
 *
 * Each factory returns a plain frozen object describing what happened
 * in business language. No audit infrastructure fields here
 * (no `category`, `action`, `captureState`, `resourceType`) — those
 * belong in the outbound auditTrail adapter.
 */

const userNotificationCreated = ({ notificationId, userId, type }) =>
    Object.freeze({
        type: 'Notification.UserNotificationCreated',
        notificationId,
        userId,
        notificationType: type
    });

const roleBroadcastSent = ({ organizationId, roleName, type, deliveredCount }) =>
    Object.freeze({
        type: 'Notification.RoleBroadcastSent',
        organizationId,
        roleName,
        notificationType: type,
        deliveredCount: Number(deliveredCount) || 0
    });

const preferencesUpdated = ({ userId, inAppEnabled, emailEnabled }) =>
    Object.freeze({
        type: 'Notification.PreferencesUpdated',
        userId,
        inAppEnabled: Boolean(inAppEnabled),
        emailEnabled: Boolean(emailEnabled)
    });

const typePreferencesUpdated = ({ userId, typeCode, inAppEnabled, emailEnabled }) =>
    Object.freeze({
        type: 'Notification.TypePreferencesUpdated',
        userId,
        typeCode,
        inAppEnabled: inAppEnabled === null ? null : Boolean(inAppEnabled),
        emailEnabled: emailEnabled === null ? null : Boolean(emailEnabled)
    });

const allNotificationsRead = ({ userId, count }) =>
    Object.freeze({
        type: 'Notification.AllRead',
        userId,
        count: Number(count) || 0
    });

module.exports = {
    userNotificationCreated,
    roleBroadcastSent,
    preferencesUpdated,
    typePreferencesUpdated,
    allNotificationsRead
};
