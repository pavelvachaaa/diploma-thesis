module.exports = ({ db }) => {
    const getExecutor = (options = {}) => options.client || db;

    const findByScopeAndKey = async ({ scope, idempotencyKey }, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `SELECT *
             FROM command_idempotency
             WHERE scope = $1 AND idempotency_key = $2
             LIMIT 1`,
            [scope, idempotencyKey]
        );

        return result.rows[0] || null;
    };

    const insertInProgress = async ({
        scope,
        idempotencyKey,
        requestHash,
        ttlSeconds = 86400
    }, options = {}) => {
        const executor = getExecutor(options);

        const result = await executor.query(
            `INSERT INTO command_idempotency (
                scope,
                idempotency_key,
                request_hash,
                status,
                expires_at
            ) VALUES (
                $1, $2, $3, 'in_progress', NOW() + ($4 * INTERVAL '1 second')
            )
            ON CONFLICT (scope, idempotency_key) DO NOTHING
            RETURNING *`,
            [scope, idempotencyKey, requestHash, ttlSeconds]
        );

        return result.rows[0] || null;
    };

    const markCompleted = async ({
        id,
        responseStatus,
        responseBody
    }, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `UPDATE command_idempotency
             SET
                status = 'completed',
                response_status = $2,
                response_body = $3::jsonb,
                error_message = NULL
             WHERE id = $1
             RETURNING *`,
            [id, responseStatus, JSON.stringify(responseBody)]
        );

        return result.rows[0] || null;
    };

    const markFailed = async ({ id, errorMessage }, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `UPDATE command_idempotency
             SET
                status = 'failed',
                error_message = $2,
                response_status = NULL,
                response_body = NULL
             WHERE id = $1
             RETURNING *`,
            [id, errorMessage]
        );

        return result.rows[0] || null;
    };

    const reclaimStaleInProgress = async ({
        scope,
        idempotencyKey,
        lockTimeoutSec = 60
    }, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `UPDATE command_idempotency
             SET status = 'failed',
                 error_message = COALESCE(error_message, 'in-progress lock expired')
             WHERE scope = $1
               AND idempotency_key = $2
               AND status = 'in_progress'
               AND updated_at < NOW() - ($3 * INTERVAL '1 second')
             RETURNING *`,
            [scope, idempotencyKey, lockTimeoutSec]
        );

        return result.rows[0] || null;
    };

    const deleteExpired = async ({ limit = 1000 } = {}, options = {}) => {
        const executor = getExecutor(options);
        const parsedLimit = Number(limit);
        const effectiveLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.trunc(parsedLimit)
            : 1000;

        const result = await executor.query(
            `WITH expired AS (
                SELECT id
                FROM command_idempotency
                WHERE expires_at <= NOW()
                ORDER BY expires_at ASC
                LIMIT $1
            )
            DELETE FROM command_idempotency
            WHERE id IN (SELECT id FROM expired)
            RETURNING id`,
            [effectiveLimit]
        );

        return result.rowCount || 0;
    };

    const getExpiredStats = async (options = {}) => {
        const executor = getExecutor(options);

        const [byScopeStatus, byAgeBucket] = await Promise.all([
            executor.query(
                `SELECT
                    scope,
                    status,
                    COUNT(*)::int AS count
                 FROM command_idempotency
                 WHERE expires_at <= NOW()
                 GROUP BY scope, status
                 ORDER BY scope ASC, status ASC`
            ),
            executor.query(
                `SELECT
                    CASE
                        WHEN NOW() - expires_at < INTERVAL '1 hour' THEN 'lt_1h'
                        WHEN NOW() - expires_at < INTERVAL '24 hours' THEN '1h_to_24h'
                        WHEN NOW() - expires_at < INTERVAL '7 days' THEN '1d_to_7d'
                        ELSE 'gte_7d'
                    END AS age_bucket,
                    COUNT(*)::int AS count
                 FROM command_idempotency
                 WHERE expires_at <= NOW()
                 GROUP BY
                    CASE
                        WHEN NOW() - expires_at < INTERVAL '1 hour' THEN 'lt_1h'
                        WHEN NOW() - expires_at < INTERVAL '24 hours' THEN '1h_to_24h'
                        WHEN NOW() - expires_at < INTERVAL '7 days' THEN '1d_to_7d'
                        ELSE 'gte_7d'
                    END
                 ORDER BY age_bucket ASC`
            )
        ]);

        return {
            byScopeStatus: byScopeStatus.rows,
            byAgeBucket: byAgeBucket.rows
        };
    };

    return {
        findByScopeAndKey,
        insertInProgress,
        markCompleted,
        markFailed,
        reclaimStaleInProgress,
        deleteExpired,
        getExpiredStats
    };
};
