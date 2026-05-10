module.exports = ({ db, buildReplaySelection }) => {
    const previewReplayDead = async (selection = {}) => {
        const normalized = buildReplaySelection(selection);
        const conditions = ['status = \'dead\''];
        const params = [];
        let idx = 1;

        if (normalized.ids.length > 0) {
            conditions.push(`id = ANY($${idx}::uuid[])`);
            params.push(normalized.ids);
            idx += 1;
        } else if (normalized.eventType) {
            conditions.push(`event_type = $${idx}`);
            params.push(normalized.eventType);
            idx += 1;
        }

        params.push(normalized.limit);

        const query = `
            SELECT
                id,
                status,
                attempts,
                max_attempts,
                event_type,
                idempotency_key,
                LEFT(COALESCE(last_error, ''), 2000) AS last_error,
                available_at,
                updated_at
            FROM side_effect_outbox
            WHERE ${conditions.join(' AND ')}
            ORDER BY updated_at DESC
            LIMIT $${idx}
        `;

        const result = await db.query(query, params);
        return result.rows;
    };

    const replayDead = async (selection = {}) => {
        const previewRows = await previewReplayDead(selection);
        const ids = previewRows.map((row) => row.id);

        if (ids.length === 0) {
            return {
                matchedCount: 0,
                replayedCount: 0,
                events: []
            };
        }

        const { rows } = await db.query(
            `UPDATE side_effect_outbox
             SET
                status = 'pending',
                attempts = 0,
                locked_at = NULL,
                locked_by = NULL,
                last_error = NULL,
                available_at = NOW(),
                updated_at = NOW()
             WHERE status = 'dead'
               AND id = ANY($1::uuid[])
             RETURNING id, event_type, status, available_at, updated_at`,
            [ids]
        );

        return {
            matchedCount: ids.length,
            replayedCount: rows.length,
            events: rows
        };
    };

    return {
        previewReplayDead,
        replayDead
    };
};
