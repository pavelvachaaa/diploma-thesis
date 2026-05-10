module.exports = ({
    db,
    getExecutor,
    getConversationPair
}) => {
    const createMessage = async ({ senderId, recipientId, body }, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            INSERT INTO direct_messages (id, sender_id, recipient_id, body, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, NOW())
            RETURNING id, sender_id, recipient_id, body, created_at, is_deleted
        `;

        const result = await executor.query(query, [senderId, recipientId, body]);
        return result.rows[0];
    };

    const addAttachments = async (messageId, attachments, options = {}) => {
        if (!attachments || attachments.length === 0) {
            return [];
        }

        const executor = getExecutor(options);
        const insertedAttachments = [];

        for (const attachment of attachments) {
            const query = `
                INSERT INTO direct_message_attachments
                (id, message_id, file_id, uploaded_at)
                VALUES (gen_random_uuid(), $1, $2, NOW())
                RETURNING *
            `;

            const result = await executor.query(query, [
                messageId,
                attachment.file_id
            ]);
            const attachmentId = result.rows[0]?.id;
            const fetch = await executor.query(`
                SELECT
                    dma.*,
                    f.object_key AS file_path,
                    f.original_filename,
                    f.mime_type,
                    f.size_bytes AS file_size,
                    f.bucket
                FROM direct_message_attachments dma
                JOIN files f ON f.id = dma.file_id
                WHERE dma.id = $1
            `, [attachmentId]);

            insertedAttachments.push(fetch.rows[0]);
        }

        return insertedAttachments;
    };

    const getMessages = async ({ currentUserId, withUserId, limit = 50, cursorCreatedAt = null, cursorId = null }) => {
        const { convoA, convoB } = getConversationPair(currentUserId, withUserId);

        let query = `
            SELECT
                dm.id,
                dm.sender_id,
                dm.recipient_id,
                dm.body,
                dm.created_at,
                dm.edited_at,
                dm.is_deleted,
                COALESCE(
                    json_agg(
                        CASE WHEN dma.id IS NOT NULL THEN
                            json_build_object(
                                'id', dma.id,
                                'originalName', f.original_filename,
                                'mimeType', f.mime_type,
                                'fileSize', f.size_bytes,
                                'uploadedAt', dma.uploaded_at
                            )
                        END
                    ) FILTER (WHERE dma.id IS NOT NULL),
                    '[]'::json
                ) as attachments
            FROM direct_messages dm
            LEFT JOIN direct_message_attachments dma ON dm.id = dma.message_id
            LEFT JOIN files f ON f.id = dma.file_id
            WHERE dm.convo_a = $1 AND dm.convo_b = $2 AND dm.is_deleted = false
        `;

        const params = [convoA, convoB];
        let paramIndex = 3;

        if (cursorCreatedAt && cursorId) {
            query += ` AND (dm.created_at > $${paramIndex} OR (dm.created_at = $${paramIndex} AND dm.id > $${paramIndex + 1}))`;
            params.push(cursorCreatedAt, cursorId);
            paramIndex += 2;
        }

        query += `
            GROUP BY dm.id, dm.sender_id, dm.recipient_id, dm.body, dm.created_at, dm.edited_at, dm.is_deleted
            ORDER BY dm.created_at ASC
            LIMIT $${paramIndex}
        `;

        params.push(limit);

        const result = await db.query(query, params);
        return result.rows;
    };

    const markReadUpTo = async ({ currentUserId, withUserId, upToMessageId }) => {
        const { convoA, convoB } = getConversationPair(currentUserId, withUserId);

        const messageResult = await db.query(`
            SELECT created_at, sender_id, recipient_id
            FROM direct_messages
            WHERE id = $1 AND convo_a = $2 AND convo_b = $3
        `, [upToMessageId, convoA, convoB]);

        if (messageResult.rows.length === 0) {
            throw new Error('Message not found in conversation');
        }

        const message = messageResult.rows[0];
        const upToTimestamp = message.created_at;

        const result = await db.query(`
            INSERT INTO direct_message_reads (id, message_id, user_id, read_at)
            SELECT gen_random_uuid(), dm.id, $1::uuid, NOW()
            FROM direct_messages dm
            WHERE dm.convo_a = $2::uuid
              AND dm.convo_b = $3::uuid
              AND dm.sender_id = $4::uuid
              AND (dm.created_at < $5::timestamp OR (dm.created_at = $5::timestamp AND dm.id::text <= $6::text))
              AND dm.is_deleted = false
              AND NOT EXISTS (
                  SELECT 1 FROM direct_message_reads dmr
                  WHERE dmr.message_id = dm.id AND dmr.user_id = $1::uuid
              )
            ON CONFLICT (message_id, user_id) DO NOTHING
            RETURNING message_id
        `, [
            currentUserId,
            convoA,
            convoB,
            withUserId,
            upToTimestamp,
            upToMessageId
        ]);

        return { markedAsRead: result.rows.length };
    };

    const softDeleteMessage = async ({ messageId, requesterId }) => {
        const result = await db.query(`
            UPDATE direct_messages
            SET is_deleted = true, edited_at = NOW()
            WHERE id = $1 AND sender_id = $2 AND is_deleted = false
            RETURNING id, sender_id, recipient_id, created_at
        `, [messageId, requesterId]);

        if (result.rows.length === 0) {
            throw new Error('Message not found or you do not have permission to delete it');
        }

        return result.rows[0];
    };

    const getAttachmentById = async (attachmentId) => {
        const result = await db.query(`
            SELECT
                dma.id,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket,
                dm.sender_id,
                dm.recipient_id
            FROM direct_message_attachments dma
            JOIN direct_messages dm ON dma.message_id = dm.id
            JOIN files f ON f.id = dma.file_id
            WHERE dma.id = $1
        `, [attachmentId]);
        return result.rows[0] || null;
    };

    const getMessageById = async (messageId) => {
        const result = await db.query(`
            SELECT
                dm.id,
                dm.sender_id,
                dm.recipient_id,
                dm.body,
                dm.created_at,
                dm.edited_at,
                dm.is_deleted,
                COALESCE(
                    json_agg(
                        CASE WHEN dma.id IS NOT NULL THEN
                            json_build_object(
                                'id', dma.id,
                                'originalName', f.original_filename,
                                'mimeType', f.mime_type,
                                'fileSize', f.size_bytes,
                                'uploadedAt', dma.uploaded_at
                            )
                        END
                    ) FILTER (WHERE dma.id IS NOT NULL),
                    '[]'::json
                ) as attachments
            FROM direct_messages dm
            LEFT JOIN direct_message_attachments dma ON dm.id = dma.message_id
            LEFT JOIN files f ON f.id = dma.file_id
            WHERE dm.id = $1
            GROUP BY dm.id, dm.sender_id, dm.recipient_id, dm.body, dm.created_at, dm.edited_at, dm.is_deleted
        `, [messageId]);
        return result.rows[0] || null;
    };

    return {
        createMessage,
        addAttachments,
        getMessages,
        markReadUpTo,
        softDeleteMessage,
        getAttachmentById,
        getMessageById
    };
};
