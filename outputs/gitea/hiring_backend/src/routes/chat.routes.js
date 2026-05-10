module.exports = ({ chatController, chatService, fileHandler, fileDownload }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { createMultipleUploadMiddleware } = fileHandler;
    const { downloadFile } = fileDownload;

    const router = Router();

    // All chat routes require authentication
    router.use(requireAuth());

    // Available users for new conversations
    router.get('/available-users', chatController.getAvailableUsers);
    router.get('/available-hr-users', chatController.getAvailableHRUsers);

    // Thread management
    router.get('/threads', chatController.getThreads);

    // Message operations for specific conversation
    router.get('/:withUserId/messages', chatController.getMessages);
    router.post(
        '/:withUserId/messages',
        createMultipleUploadMiddleware('chat-attachments', 'files', 5),
        chatController.sendMessage
    );
    router.post('/:withUserId/read', chatController.markAsRead);

    // File attachment download
    router.get('/attachments/:attachmentId', async (req, res, next) => {
        try {
            const { attachmentId } = req.params;

            if (!attachmentId) {
                return res.status(400).json({ error: 'Attachment ID is required' });
            }

            const fileInfo = await chatService.getAttachmentForDownload(attachmentId, req.user);
            await downloadFile(res, fileInfo, req.user, 'chat-attachment', {
                resourceId: attachmentId
            });
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('Access denied')) {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    });

    // Message management
    router.delete('/messages/:messageId', chatController.deleteMessage);

    // Conversation management (HR/Admin only)
    router.delete('/conversations/:withUserId', chatController.deleteConversation);

    return router;
};
