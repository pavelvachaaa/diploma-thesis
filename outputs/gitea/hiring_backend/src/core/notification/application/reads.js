const NotificationReadRequest = require('@core/notification/domain/NotificationReadRequest');
const NotificationEvents = require('@core/notification/domain/events');

module.exports = ({ notificationStorePort, notificationAuditPort }) => {
    const getUserNotifications = async (query = {}) => {
        const request = NotificationReadRequest.createListQuery(query);
        return notificationStorePort.listByUser(request);
    };

    const getUnreadCount = async (userId) => {
        const request = NotificationReadRequest.createUserRequest(userId);
        return notificationStorePort.unreadCount(request.userId);
    };

    const markAsRead = async (id, userId) => {
        const request = NotificationReadRequest.createMarkReadRequest(id, userId);
        return notificationStorePort.markRead(request.id, request.userId);
    };

    const markAllAsRead = async (userId) => {
        const request = NotificationReadRequest.createUserRequest(userId);
        const count = await notificationStorePort.markAllRead(request.userId);

        if (count > 0) {
            notificationAuditPort?.recordAllNotificationsRead(
                NotificationEvents.allNotificationsRead({ userId: request.userId, count })
            );
        }

        return count;
    };

    return {
        getUserNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead
    };
};
