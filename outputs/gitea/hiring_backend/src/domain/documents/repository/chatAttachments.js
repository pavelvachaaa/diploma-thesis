module.exports = ({ getExecutor }) => {
    const insertChatAttachment = async (messageId, fileData, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            INSERT INTO direct_message_attachments
            (id, message_id, file_id, uploaded_at)
            VALUES (gen_random_uuid(), $1, $2, NOW())
            RETURNING *
        `;

        const result = await executor.query(query, [
            messageId,
            fileData.fileId
        ]);

        return result.rows[0];
    };

    return {
        insertChatAttachment
    };
};
