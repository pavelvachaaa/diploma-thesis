module.exports = ({
    db,
    buildFilterClauses,
    toPositiveInt,
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT
}) => {
    const inspectSummary = async (filters = {}) => {
        const { conditions, params } = buildFilterClauses(filters);
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const summaryQuery = `
            SELECT
                status,
                event_type,
                COUNT(*)::int AS count,
                MIN(created_at) AS first_created,
                MAX(updated_at) AS last_updated
            FROM side_effect_outbox
            ${whereClause}
            GROUP BY status, event_type
            ORDER BY status ASC, event_type ASC
        `;

        const deadConditions = ['status = \'dead\''];
        const deadParams = [];
        let deadIdx = 1;

        if (filters.eventType) {
            deadConditions.push(`event_type = $${deadIdx}`);
            deadParams.push(filters.eventType);
            deadIdx += 1;
        }

        const deadReasonsQuery = `
            SELECT
                event_type,
                LEFT(COALESCE(last_error, '<none>'), 180) AS reason,
                COUNT(*)::int AS count
            FROM side_effect_outbox
            WHERE ${deadConditions.join(' AND ')}
            GROUP BY event_type, LEFT(COALESCE(last_error, '<none>'), 180)
            ORDER BY count DESC, event_type ASC, reason ASC
            LIMIT 100
        `;

        const operabilityLagQuery = `
            SELECT
                MIN(CASE WHEN status = 'pending' THEN created_at END) AS oldest_pending_created_at,
                MIN(CASE WHEN status = 'processing' THEN locked_at END) AS oldest_processing_locked_at
            FROM side_effect_outbox
            ${whereClause}
        `;

        const attemptsDistributionQuery = `
            SELECT
                status,
                event_type,
                attempts,
                COUNT(*)::int AS count
            FROM side_effect_outbox
            ${whereClause}
            GROUP BY status, event_type, attempts
            ORDER BY status ASC, event_type ASC, attempts ASC
            LIMIT 500
        `;

        const deadByEventTypeQuery = `
            SELECT
                event_type,
                COUNT(*)::int AS count
            FROM side_effect_outbox
            WHERE status = 'dead'
            GROUP BY event_type
            ORDER BY count DESC, event_type ASC
        `;

        const deadTrendParams = [];
        const deadTrendConditions = [`status = 'dead'`, `updated_at >= NOW() - INTERVAL '24 hours'`];
        if (filters.eventType) {
            deadTrendConditions.push(`event_type = $${deadTrendParams.length + 1}`);
            deadTrendParams.push(filters.eventType);
        }

        const deadTrendQuery = `
            SELECT
                date_trunc('hour', updated_at) AS hour_bucket,
                event_type,
                COUNT(*)::int AS count
            FROM side_effect_outbox
            WHERE ${deadTrendConditions.join(' AND ')}
            GROUP BY date_trunc('hour', updated_at), event_type
            ORDER BY hour_bucket DESC, event_type ASC
            LIMIT 500
        `;

        const pendingAgeBucketsQuery = `
            SELECT
                CASE
                    WHEN NOW() - created_at < INTERVAL '5 minutes' THEN 'lt_5m'
                    WHEN NOW() - created_at < INTERVAL '30 minutes' THEN '5m_to_30m'
                    WHEN NOW() - created_at < INTERVAL '2 hours' THEN '30m_to_2h'
                    ELSE 'gte_2h'
                END AS age_bucket,
                COUNT(*)::int AS count
            FROM side_effect_outbox
            ${whereClause}
            GROUP BY
                CASE
                    WHEN NOW() - created_at < INTERVAL '5 minutes' THEN 'lt_5m'
                    WHEN NOW() - created_at < INTERVAL '30 minutes' THEN '5m_to_30m'
                    WHEN NOW() - created_at < INTERVAL '2 hours' THEN '30m_to_2h'
                    ELSE 'gte_2h'
                END
            ORDER BY age_bucket ASC
            LIMIT 10
        `;

        const [
            summaryResult,
            deadReasonsResult,
            lagResult,
            attemptsResult,
            deadByEventTypeResult,
            deadTrendResult,
            pendingAgeBucketsResult
        ] = await Promise.all([
            db.query(summaryQuery, params),
            db.query(deadReasonsQuery, deadParams),
            db.query(operabilityLagQuery, params),
            db.query(attemptsDistributionQuery, params),
            db.query(deadByEventTypeQuery),
            db.query(deadTrendQuery, deadTrendParams),
            db.query(pendingAgeBucketsQuery, params)
        ]);

        const oldestPendingCreatedAt = lagResult.rows[0]?.oldest_pending_created_at || null;
        const oldestProcessingLockedAt = lagResult.rows[0]?.oldest_processing_locked_at || null;
        const now = Date.now();
        const oldestPendingAgeSec = oldestPendingCreatedAt
            ? Math.max(0, Math.floor((now - new Date(oldestPendingCreatedAt).getTime()) / 1000))
            : null;
        const oldestProcessingAgeSec = oldestProcessingLockedAt
            ? Math.max(0, Math.floor((now - new Date(oldestProcessingLockedAt).getTime()) / 1000))
            : null;

        return {
            summary: summaryResult.rows,
            deadReasons: deadReasonsResult.rows,
            operability: {
                oldestPendingCreatedAt,
                oldestPendingAgeSec,
                oldestProcessingLockedAt,
                oldestProcessingAgeSec,
                attemptsDistribution: attemptsResult.rows,
                deadByEventType: deadByEventTypeResult.rows,
                deadTrend24h: deadTrendResult.rows,
                pendingAgeBuckets: pendingAgeBucketsResult.rows
            }
        };
    };

    const listEvents = async (filters = {}) => {
        const page = Math.max(Number(filters.page) || 0, 0);
        const limit = toPositiveInt(filters.limit, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
        const offset = page * limit;
        const { conditions, params, nextIndex } = buildFilterClauses(filters);
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const listQuery = `
            SELECT
                id,
                status,
                attempts,
                max_attempts,
                event_type,
                idempotency_key,
                aggregate_type,
                aggregate_id,
                organization_id,
                request_id,
                LEFT(COALESCE(last_error, ''), 2000) AS last_error,
                available_at,
                locked_at,
                locked_by,
                sent_at,
                updated_at,
                created_at
            FROM side_effect_outbox
            ${whereClause}
            ORDER BY updated_at DESC
            LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
        `;

        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM side_effect_outbox
            ${whereClause}
        `;

        const [dataResult, countResult] = await Promise.all([
            db.query(listQuery, [...params, limit, offset]),
            db.query(countQuery, params)
        ]);

        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total: countResult.rows[0]?.total || 0,
                totalPages: Math.ceil((countResult.rows[0]?.total || 0) / limit)
            }
        };
    };

    return {
        inspectSummary,
        listEvents
    };
};
