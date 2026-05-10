module.exports = ({ db, getExecutor }) => {
    const getApplicantAttachmentForDownload = async (attachmentId, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                f.object_key AS file_path,
                f.original_filename AS original_name,
                f.mime_type,
                aa.uploaded_at,
                f.bucket
            FROM application_attachments aa
            JOIN files f ON f.id = aa.file_id
            WHERE aa.id = $1
        `;

        const result = await executor.query(query, [attachmentId]);
        if (result.rows.length === 0) {
            throw new Error('Attachment not found');
        }

        return result.rows[0];
    };

    const getChatAttachmentForDownload = async (attachmentId, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                f.object_key AS file_path,
                f.original_filename AS original_name,
                f.mime_type,
                f.bucket,
                dma.uploaded_at,
                dm.sender_id,
                dm.recipient_id
            FROM direct_message_attachments dma
            JOIN direct_messages dm ON dma.message_id = dm.id
            JOIN files f ON f.id = dma.file_id
            WHERE dma.id = $1
        `;

        const result = await executor.query(query, [attachmentId]);
        if (result.rows.length === 0) {
            throw new Error('Chat attachment not found');
        }

        return result.rows[0];
    };

    return {
        getApplicantAttachmentForDownload,
        getChatAttachmentForDownload
    };
};
