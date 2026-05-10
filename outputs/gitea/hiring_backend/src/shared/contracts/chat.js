const toChatMessageResponse = ({ message, attachments = [] }) => ({
    id: message.id,
    senderId: message.sender_id,
    recipientId: message.recipient_id,
    body: message.body,
    createdAt: message.created_at,
    attachments: attachments.map((att) => ({
        id: att.id,
        originalName: att.original_filename,
        mimeType: att.mime_type,
        fileSize: att.file_size
    }))
});

module.exports = {
    toChatMessageResponse
};
