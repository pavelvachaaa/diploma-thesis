module.exports = ({ db, getExecutor }) => {
    const enqueue = async (event = {}, options = {}) => {
        const {
            eventType,
            idempotencyKey = null,
            aggregateType = null,
            aggregateId = null,
            organizationId = null,
            requestId = null,
            payload = {},
            maxAttempts = 10,
            availableAt = null
        } = event;

        if (!eventType) {
            throw new Error('eventType is required for side effect outbox enqueue');
        }

        const executor = getExecutor(options);

        const result = await executor.query(
            `INSERT INTO side_effect_outbox (
                event_type,
                idempotency_key,
                aggregate_type,
                aggregate_id,
                organization_id,
                request_id,
                payload,
                max_attempts,
                available_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7::jsonb, $8, COALESCE($9, NOW())
            )
            ON CONFLICT (idempotency_key) DO NOTHING
            RETURNING *`,
            [
                eventType,
                idempotencyKey,
                aggregateType,
                aggregateId,
                organizationId,
                requestId,
                JSON.stringify(payload || {}),
                maxAttempts,
                availableAt
            ]
        );

        if (result.rows[0]) {
            return result.rows[0];
        }

        if (!idempotencyKey) {
            return null;
        }

        const existing = await executor.query(
            `SELECT *
             FROM side_effect_outbox
             WHERE idempotency_key = $1
             LIMIT 1`,
            [idempotencyKey]
        );

        return existing.rows[0] || null;
    };

    const requeueStaleProcessing = async (lockTimeoutSeconds = 120) => {
        const { rows } = await db.query(
            `UPDATE side_effect_outbox
             SET
                status = 'pending',
                locked_at = NULL,
                locked_by = NULL,
                available_at = NOW(),
                updated_at = NOW(),
                last_error = COALESCE(last_error, 'processing lock expired')
             WHERE status = 'processing'
               AND locked_at < NOW() - ($1 * INTERVAL '1 second')
             RETURNING id`,
            [lockTimeoutSeconds]
        );

        return rows.length;
    };

    const claimPendingBatch = async ({ limit = 20, workerId }) => {
        const { rows } = await db.query(
            `WITH candidates AS (
                SELECT id
                FROM side_effect_outbox
                WHERE status = 'pending'
                  AND available_at <= NOW()
                ORDER BY available_at ASC, created_at ASC
                LIMIT $1
                FOR UPDATE SKIP LOCKED
            )
            UPDATE side_effect_outbox seo
            SET
                status = 'processing',
                attempts = seo.attempts + 1,
                locked_at = NOW(),
                locked_by = $2,
                updated_at = NOW()
            FROM candidates
            WHERE seo.id = candidates.id
            RETURNING seo.*`,
            [limit, workerId]
        );

        return rows;
    };

    const markSent = async ({ id, resultMeta = null }) => {
        const { rows } = await db.query(
            `UPDATE side_effect_outbox
             SET
                status = 'sent',
                sent_at = NOW(),
                result_meta = $2::jsonb,
                locked_at = NULL,
                locked_by = NULL,
                last_error = NULL,
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [id, resultMeta ? JSON.stringify(resultMeta) : null]
        );

        return rows[0] || null;
    };

    const markFailed = async ({
        id,
        errorMessage,
        nextAvailableAt = null,
        moveToDead = false,
        resultMeta = null
    }) => {
        const { rows } = await db.query(
            `UPDATE side_effect_outbox
             SET
                status = $2,
                available_at = COALESCE($3, available_at),
                locked_at = NULL,
                locked_by = NULL,
                last_error = $4,
                result_meta = COALESCE($5::jsonb, result_meta),
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                moveToDead ? 'dead' : 'pending',
                nextAvailableAt,
                errorMessage,
                resultMeta ? JSON.stringify(resultMeta) : null
            ]
        );

        return rows[0] || null;
    };

    return {
        enqueue,
        requeueStaleProcessing,
        claimPendingBatch,
        markSent,
        markFailed
    };
};
