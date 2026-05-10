const {
    buildNormalizedTypeSet,
    createOutboxStrategy
} = require('./shared');

module.exports = ({ notificationService, eventTypes }) => {
    const dispatchRoleNotification = async (event) => {
        const payload = event.payload || {};

        await notificationService.notifyRoleInOrg({
            type: payload.type,
            organizationId: payload.organizationId,
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            actionUrl: payload.actionUrl || null,
            roleName: payload.roleName || 'HR'
        });

        return {
            delivery: 'notification.role'
        };
    };

    const dispatchUserNotification = async (event) => {
        const payload = event.payload || {};

        await notificationService.notifyUser({
            userId: payload.userId,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            actionUrl: payload.actionUrl || null,
            skipPreferences: payload.skipPreferences === true
        });

        return {
            delivery: 'notification.user'
        };
    };

    return [
        createOutboxStrategy({
            key: 'role',
            eventTypes: buildNormalizedTypeSet(eventTypes?.ROLE_NOTIFICATION, [
                'notification.role.v1',
                'notification.role'
            ]),
            prefixes: ['notification.role'],
            dispatch: dispatchRoleNotification
        }),
        createOutboxStrategy({
            key: 'user',
            eventTypes: buildNormalizedTypeSet(eventTypes?.USER_NOTIFICATION, [
                'notification.user.v1',
                'notification.user'
            ]),
            prefixes: ['notification.user'],
            dispatch: dispatchUserNotification
        })
    ];
};
