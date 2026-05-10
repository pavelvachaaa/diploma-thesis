const createChatEvents = require('@domain/chat/events');
const { toChatMessageResponse } = require('@shared/contracts/chat');
const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');

module.exports = ({
    chatRepository,
    chatAccessPolicy,
    notificationUrlPort,
    sideEffectOutboxService,
    fileGateway,
    logger
}) => {
    const chatEvents = createChatEvents({
        sideEffectOutboxService,
        notificationUrlPort,
        logger
    });

    const normalizeCurrentUser = (currentUserOrId) => {
        if (typeof currentUserOrId === 'string') {
            return {
                id: currentUserOrId,
                roles: [],
                organizations: [],
                organization_id: null
            };
        }

        return currentUserOrId || {};
    };
    /**
     * Send a message with optional attachments
     * @param {string} senderId - Current user ID
     * @param {string} recipientId - Target user ID
     * @param {string} body - Message text (optional if files attached)
     * @param {Array} files - Uploaded files array (optional)
     * @returns {Object} Message with attachments
     */
    const sendMessageWithAttachments = async (currentUserOrId, recipientId, body, files = []) => {
        const currentUser = normalizeCurrentUser(currentUserOrId);
        const senderId = currentUser?.id;

        // Validate participants
        validateMessageParticipants(senderId, recipientId);
        await chatAccessPolicy.assertPeerAccessible(currentUser, recipientId);

        // Validate message content
        if (!body && (!files || files.length === 0)) {
            throw new Error('Zpráva musí obsahovat text nebo přílohu');
        }

        let outboxMetadata;
        try {
            outboxMetadata = await chatRepository.withTransaction(async (client) => {
                const message = await chatRepository.createMessage({
                    senderId,
                    recipientId,
                    body: body || null
                }, { client });

                let attachments = [];
                if (files && files.length > 0) {
                    const attachmentData = [];
                    for (const file of files) {
                        const fileRecord = await fileGateway.createFileRecord({
                            bucket: file.bucket
                                || (String(file.key || '').startsWith('chat-attachments/') ? 'chat-files' : 'attachments'),
                            objectKey: file.key,
                            mimeType: file.mimetype,
                            sizeBytes: file.size,
                            originalFilename: file.originalname,
                            checksumSha256: file.checksum_sha256 || null,
                            sourceModule: 'chat',
                            uploadedBy: senderId,
                            metadata: {
                                senderId,
                                recipientId
                            }
                        }, { client });

                        attachmentData.push({
                            file_id: fileRecord.id
                        });
                    }

                    attachments = await chatRepository.addAttachments(message.id, attachmentData, { client });
                }

                const { outboxId } = await chatEvents.enqueueMessageNotification({
                    client,
                    senderId,
                    recipientId,
                    messageId: message.id,
                    body,
                    hasAttachments: attachments.length > 0
                });

                return {
                    message,
                    attachments,
                    outboxId
                };
            });
        } catch (error) {
            for (const file of files || []) {
                if (!file?.bucket || !file?.key) {
                    continue;
                }

                try {
                    await enqueueFileGcDelete({
                        sideEffectOutboxService,
                        bucket: file.bucket,
                        objectKey: file.key,
                        reason: 'transaction_rollback_cleanup',
                        sourceModule: 'chat.sendMessage'
                    });
                } catch (cleanupError) {
                    logger?.warn?.('Failed to enqueue chat attachment rollback cleanup', {
                        error: cleanupError.message,
                        objectKey: file.key
                    });
                }
            }

            throw error;
        }

        const { message, attachments, outboxId } = outboxMetadata;

        logger.info('Message sent successfully', {
            messageId: message.id,
            senderId,
            recipientId,
            hasBody: !!body,
            attachmentCount: attachments.length,
            notificationOutboxId: outboxId
        });

        // Return formatted message response
        return toChatMessageResponse({ message, attachments });
    };

    /**
     * List messages in a conversation with pagination
     * @param {string} currentUserId - Current user ID
     * @param {string} withUserId - Other user ID
     * @param {Object} options - Pagination options
     * @returns {Array} Array of messages with attachments
     */
    const listMessages = async (currentUserOrId, withUserId, { limit = 50, cursorCreatedAt = null, cursorId = null } = {}) => {
        const currentUser = normalizeCurrentUser(currentUserOrId);
        const currentUserId = currentUser?.id;

        // Validate participants
        validateMessageParticipants(currentUserId, withUserId);
        await chatAccessPolicy.assertPeerAccessible(currentUser, withUserId);

        const messages = await chatRepository.getMessages({
            currentUserId,
            withUserId,
            limit,
            cursorCreatedAt,
            cursorId
        });

        return messages.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            recipientId: msg.recipient_id,
            body: msg.body,
            createdAt: msg.created_at,
            editedAt: msg.edited_at,
            attachments: msg.attachments || []
        }));
    };

    /**
     * List conversation threads for a user
     * @param {string} currentUserId - Current user ID
     * @param {Object} options - Pagination options
     * @returns {Array} Array of conversation threads
     */
    const listThreads = async (currentUserOrId, { limit = 20, offset = 0 } = {}) => {
        const currentUser = normalizeCurrentUser(currentUserOrId);
        const currentUserId = currentUser?.id;

        if (!currentUserId) {
            throw new Error('Current user ID is required');
        }

        const rawThreads = await chatRepository.getThreads({
            currentUserId,
            limit,
            offset
        });
        const threads = await chatAccessPolicy.filterThreads(currentUser, rawThreads);

        return threads.map(thread => ({
            peerUserId: thread.peerUserId,
            peerName: thread.peerName,
            peerSurname: thread.peerSurname,
            peerEmail: thread.peerEmail,
            lastMessage: {
                id: thread.lastMessage.id,
                body: thread.lastMessage.body,
                createdAt: thread.lastMessage.createdAt,
                hasAttachments: thread.lastMessage.hasAttachments,
                senderId: thread.lastMessage.senderId
            },
            unreadCount: parseInt(thread.unreadCount) || 0
        }));
    };

    /**
     * Mark messages as read up to a specific message
     * @param {string} currentUserId - Current user ID
     * @param {string} withUserId - Other user ID
     * @param {string} upToMessageId - Message ID to mark as read up to
     * @returns {Object} Read receipt result
     */
    const markAsRead = async (currentUserOrId, withUserId, upToMessageId) => {
        const currentUser = normalizeCurrentUser(currentUserOrId);
        const currentUserId = currentUser?.id;

        // Validate participants
        validateMessageParticipants(currentUserId, withUserId);
        await chatAccessPolicy.assertPeerAccessible(currentUser, withUserId);

        if (!upToMessageId) {
            throw new Error('Message ID is required');
        }

        const result = await chatRepository.markReadUpTo({
            currentUserId,
            withUserId,
            upToMessageId
        });

        logger.info('Messages marked as read', {
            currentUserId,
            withUserId,
            upToMessageId,
            markedAsRead: result.markedAsRead
        });

        return result;
    };

    /**
     * Delete a message (soft delete, sender only)
     * @param {string} messageId - Message ID to delete
     * @param {string} requesterId - User requesting deletion
     * @returns {Object} Deleted message info
     */
    const deleteMessage = async (messageId, requesterId) => {
        if (!messageId || !requesterId) {
            throw new Error('Message ID and requester ID are required');
        }

        const deletedMessage = await chatRepository.softDeleteMessage({
            messageId,
            requesterId
        });

        logger.info('Message deleted', {
            messageId,
            requesterId,
            originalSender: deletedMessage.sender_id
        });

        return deletedMessage;
    };

    /**
     * Get attachment for download (with security checks)
     * @param {string} attachmentId - Attachment ID
     * @param {string} requesterId - User requesting download
     * @returns {Object} File download information
     */
    const getAttachmentForDownload = async (attachmentId, currentUserOrId) => {
        const currentUser = normalizeCurrentUser(currentUserOrId);
        const requesterId = currentUser?.id;

        if (!attachmentId || !requesterId) {
            throw new Error('Attachment ID and requester ID are required');
        }

        const attachment = await chatRepository.getAttachmentById(attachmentId);
        if (!attachment) {
            throw new Error('Attachment not found');
        }

        // Security check: ensure requester is part of the conversation
        if (attachment.sender_id !== requesterId && attachment.recipient_id !== requesterId) {
            throw new Error('Access denied: you are not part of this conversation');
        }

        const peerUserId = attachment.sender_id === requesterId
            ? attachment.recipient_id
            : attachment.sender_id;
        await chatAccessPolicy.assertPeerAccessible(currentUser, peerUserId);

        return {
            file_path: attachment.file_path,
            original_name: attachment.original_filename,
            mime_type: attachment.mime_type,
            bucket: attachment.bucket || null
        };
    };

    /**
     * Delete entire conversation between two users
     */
    const deleteConversation = async (currentUserOrId, withUserId) => {
        const currentUser = normalizeCurrentUser(currentUserOrId);
        const userId = currentUser?.id;

        // Validate user IDs
        validateMessageParticipants(userId, withUserId);
        await chatAccessPolicy.assertPeerAccessible(currentUser, withUserId);

        // Delete all messages in this conversation (soft delete)
        const deletedCount = await chatRepository.deleteConversation(userId, withUserId);

        return deletedCount;
    };

    /**
     * Get HR users available for chat (for employee users)
     */
    const getHRUsersForChat = async (organizationId, currentUserId) => {
        if (!organizationId || !currentUserId) {
            throw new Error('Organization ID and user ID are required');
        }

        // Get HR users from the same organization
        const hrUsers = await chatRepository.getHRUsersByOrganization(organizationId, currentUserId);

        return hrUsers;
    };

    const getAvailableUsers = async (currentUser, options = {}) => {
        const peers = await chatAccessPolicy.getAllowedPeers(currentUser, options);

        return peers.map((user) => ({
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            organization_name: user.organization_name,
            roles: Array.isArray(user.roles) ? user.roles : []
        }));
    };

    /**
     * Validate message participants
     * @private
     */
    const validateMessageParticipants = (senderId, recipientId) => {
        if (!senderId || !recipientId) {
            throw new Error('Sender and recipient IDs are required');
        }

        if (senderId === recipientId) {
            throw new Error('Cannot send message to yourself');
        }

        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(senderId) || !uuidRegex.test(recipientId)) {
            throw new Error('Invalid user ID format');
        }
    };

    return {
        sendMessageWithAttachments,
        listMessages,
        listThreads,
        markAsRead,
        deleteMessage,
        getAttachmentForDownload,
        deleteConversation,
        getHRUsersForChat,
        getAvailableUsers,
        validateMessageParticipants
    };
};
