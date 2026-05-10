module.exports = ({
    db,
    getConversationPair
}) => {
    const getThreads = async ({ currentUserId, limit = 20, offset = 0 }) => {
        const query = `
            WITH thread_messages AS (
                SELECT DISTINCT ON (convo_a, convo_b)
                    convo_a,
                    convo_b,
                    id,
                    sender_id,
                    recipient_id,
                    body,
                    created_at,
                    (SELECT COUNT(*) > 0 FROM direct_message_attachments WHERE message_id = dm.id) as has_attachments
                FROM direct_messages dm
                WHERE (sender_id = $1 OR recipient_id = $1) AND is_deleted = false
                ORDER BY convo_a, convo_b, created_at DESC
            ),
            thread_info AS (
                SELECT
                    tm.*,
                    CASE
                        WHEN tm.sender_id = $1 THEN tm.recipient_id
                        ELSE tm.sender_id
                    END as peer_user_id,
                    u.name as peer_name,
                    u.surname as peer_surname,
                    u.email as peer_email,
                    (
                        SELECT COUNT(*)
                        FROM direct_messages dm2
                        WHERE dm2.convo_a = tm.convo_a
                          AND dm2.convo_b = tm.convo_b
                          AND dm2.sender_id != $1
                          AND dm2.is_deleted = false
                          AND NOT EXISTS (
                              SELECT 1 FROM direct_message_reads dmr
                              WHERE dmr.message_id = dm2.id AND dmr.user_id = $1
                          )
                    ) as unread_count
                FROM thread_messages tm
                LEFT JOIN users u ON u.id = CASE
                    WHEN tm.sender_id = $1 THEN tm.recipient_id
                    ELSE tm.sender_id
                END
            )
            SELECT
                peer_user_id as "peerUserId",
                peer_name as "peerName",
                peer_surname as "peerSurname",
                peer_email as "peerEmail",
                json_build_object(
                    'id', id,
                    'body', body,
                    'createdAt', created_at,
                    'hasAttachments', has_attachments,
                    'senderId', sender_id
                ) as "lastMessage",
                created_at as "lastAt",
                unread_count as "unreadCount"
            FROM thread_info
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [currentUserId, limit, offset]);
        return result.rows;
    };

    const deleteConversation = async (userId, withUserId) => {
        const { convoA, convoB } = getConversationPair(userId, withUserId);
        const result = await db.query(`
            UPDATE direct_messages
            SET is_deleted = true
            WHERE convo_a = $1
              AND convo_b = $2
              AND is_deleted = false
        `, [convoA, convoB]);
        return result.rowCount || 0;
    };

    return {
        getThreads,
        deleteConversation
    };
};
