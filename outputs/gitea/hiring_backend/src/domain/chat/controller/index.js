module.exports = ({ chatService, commandIdempotencyService, logger }) => {
    /**
     * Chat controller for direct messaging API endpoints
     * Handles HTTP requests for message operations, file attachments, and thread management
     */
    const executeIdempotent = require('@shared/http/idempotency');

    const getThreads = async (req, res, next) => {
        try {
            const { limit = 20, offset = 0 } = req.query;

            const threads = await chatService.listThreads(req.user, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json(threads);
        } catch (err) {
            next(err);
        }
    };

    const getMessages = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const { withUserId } = req.params;
            const { limit = 50, cursorCreatedAt, cursorId } = req.query;

            // Validate withUserId is a valid UUID and not current user
            if (!withUserId || withUserId === currentUserId) {
                return res.status(400).json({ error: 'Invalid recipient user ID' });
            }

            const messages = await chatService.listMessages(req.user, withUserId, {
                limit: parseInt(limit),
                cursorCreatedAt: cursorCreatedAt || null,
                cursorId: cursorId || null
            });

            res.json(messages);
        } catch (err) {
            next(err);
        }
    };

    const sendMessage = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const { withUserId } = req.params;
            const { body } = req.body;
            const files = req.files || [];

            // Validate withUserId is a valid UUID and not current user
            if (!withUserId || withUserId === currentUserId) {
                return res.status(400).json({ error: 'Invalid recipient user ID' });
            }

            const result = await executeIdempotent({
                commandIdempotencyService,
                req,
                scope: 'chat.sendMessage',
                logger,
                handler: async () => {
                    const message = await chatService.sendMessageWithAttachments(
                        req.user,
                        withUserId,
                        body,
                        files
                    );

                    return {
                        statusCode: 201,
                        body: message
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const markAsRead = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const { withUserId } = req.params;
            const { upToMessageId } = req.body;

            // Validate withUserId and upToMessageId
            if (!withUserId || withUserId === currentUserId) {
                return res.status(400).json({ error: 'Invalid recipient user ID' });
            }

            if (!upToMessageId) {
                return res.status(400).json({ error: 'Message ID is required' });
            }

            const result = await chatService.markAsRead(req.user, withUserId, upToMessageId);

            res.json({
                success: true,
                markedAsRead: result.markedAsRead
            });
        } catch (err) {
            next(err);
        }
    };

    const deleteMessage = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const { messageId } = req.params;

            if (!messageId) {
                return res.status(400).json({ error: 'Message ID is required' });
            }

            await chatService.deleteMessage(messageId, currentUserId);

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (err) {
            if (err.message.includes('not found') || err.message.includes('permission')) {
                return res.status(403).json({ error: err.message });
            }
            next(err);
        }
    };

    const deleteConversation = async (req, res, next) => {
        try {
            const { withUserId } = req.params;

            if (!withUserId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const deletedCount = await chatService.deleteConversation(req.user, withUserId);

            res.json({
                success: true,
                message: `Conversation deleted successfully. ${deletedCount} messages removed.`,
                deletedMessages: deletedCount
            });
        } catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ error: 'Conversation not found' });
            }
            next(err);
        }
    };

    const getAvailableHRUsers = async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const organizationId = req.user.organization_id;

            // Get all HR users from the same organization
            const hrUsers = await chatService.getHRUsersForChat(organizationId, currentUserId);

            res.json(hrUsers);
        } catch (err) {
            next(err);
        }
    };

    const getAvailableUsers = async (req, res, next) => {
        try {
            const users = await chatService.getAvailableUsers(req.user);
            res.json(users);
        } catch (err) {
            next(err);
        }
    };

    return {
        getThreads,
        getMessages,
        sendMessage,
        markAsRead,
        deleteMessage,
        deleteConversation,
        getAvailableHRUsers,
        getAvailableUsers
    };
};
