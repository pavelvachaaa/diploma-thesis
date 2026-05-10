const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ notificationService }) => {
    const getNotifications = handle(async (req, res) => {
        const requestedLimit = req.query.limit ?? 50;
        const notifications = await notificationService.getUserNotifications({
            userId: req.user.id,
            limit: requestedLimit,
            cursor: req.query.cursor || null
        });

        const effectiveLimit = Number.parseInt(requestedLimit, 10);

        return sendResult(res, {
            notifications,
            hasMore: notifications.length === effectiveLimit,
            nextCursor: notifications.length > 0
                ? notifications[notifications.length - 1].createdAt
                : null
        });
    });

    const getUnreadCount = handle(async (req, res) => {
        const count = await notificationService.getUnreadCount(req.user.id);
        return sendResult(res, { count });
    });

    const markAsRead = handle(async (req, res) => {
        const success = await notificationService.markAsRead(req.params.id, req.user.id);

        if (!success) {
            return sendResult(res, {
                error: 'Notification not found or already read'
            }, 404);
        }

        return sendResult(res, { success: true });
    });

    const markAllAsRead = handle(async (req, res) => {
        const markedCount = await notificationService.markAllAsRead(req.user.id);

        return sendResult(res, {
            success: true,
            markedCount
        });
    });

    const getPreferences = handle(async (req, res) => {
        const preferences = await notificationService.getPreferences(req.user.id);
        return sendResult(res, preferences);
    });

    const updatePreferences = handle(async (req, res) => {
        const updatedPreferences = await notificationService.updatePreferences(req.user.id, {
            inAppEnabled: req.body?.inAppEnabled,
            emailEnabled: req.body?.emailEnabled
        });

        return sendResult(res, updatedPreferences);
    });

    const getTypePreferences = handle(async (req, res) => {
        const preferences = await notificationService.getTypePreferences(req.user.id, req.params.code);
        return sendResult(res, preferences);
    });

    const updateTypePreferences = handle(async (req, res) => {
        const updatedPreferences = await notificationService.updateTypePreferences(
            req.user.id,
            req.params.code,
            {
                inAppEnabled: req.body?.inAppEnabled,
                emailEnabled: req.body?.emailEnabled
            }
        );

        return sendResult(res, updatedPreferences);
    });

    return {
        getNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        getPreferences,
        updatePreferences,
        getTypePreferences,
        updateTypePreferences
    };
};
