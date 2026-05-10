#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const OUTBOX_TABLE = 'side_effect_outbox';

const loadEnv = () => {
    if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DB) {
        return;
    }

    const cwd = process.cwd();
    const preferred = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
    const candidates = [preferred, '.env.local', '.env'];

    for (const fileName of candidates) {
        const filePath = path.join(cwd, fileName);
        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath, override: false });
            return;
        }
    }
};

loadEnv();

require('module-alias/register');
const createDb = require('@platform/db');
const logger = require('@platform/logger');
const db = createDb({ logger });
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

const parseArgs = (argv = []) => {
    const options = {
        limit: DEFAULT_LIMIT,
        status: null,
        eventType: null,
        json: false
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (!arg.startsWith('--') && i === 0) {
            const parsed = Number(arg);
            if (Number.isFinite(parsed) && parsed > 0) {
                options.limit = Math.min(Math.trunc(parsed), MAX_LIMIT);
            }
            continue;
        }

        if (arg === '--json') {
            options.json = true;
            continue;
        }

        if (arg === '--status' && argv[i + 1]) {
            options.status = argv[i + 1];
            i += 1;
            continue;
        }

        if (arg.startsWith('--status=')) {
            options.status = arg.slice('--status='.length) || null;
            continue;
        }

        if (arg === '--event-type' && argv[i + 1]) {
            options.eventType = argv[i + 1];
            i += 1;
            continue;
        }

        if (arg.startsWith('--event-type=')) {
            options.eventType = arg.slice('--event-type='.length) || null;
            continue;
        }

        if (arg === '--limit' && argv[i + 1]) {
            const parsed = Number(argv[i + 1]);
            if (Number.isFinite(parsed) && parsed > 0) {
                options.limit = Math.min(Math.trunc(parsed), MAX_LIMIT);
            }
            i += 1;
            continue;
        }

        if (arg.startsWith('--limit=')) {
            const parsed = Number(arg.slice('--limit='.length));
            if (Number.isFinite(parsed) && parsed > 0) {
                options.limit = Math.min(Math.trunc(parsed), MAX_LIMIT);
            }
        }
    }

    return options;
};

const options = parseArgs(process.argv.slice(2));

const run = async () => {
    try {
        const conditions = [];
        const params = [];

        if (options.status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(options.status);
        }

        if (options.eventType) {
            conditions.push(`event_type = $${params.length + 1}`);
            params.push(options.eventType);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const summaryQuery = `
            SELECT
                status,
                event_type,
                COUNT(*)::int AS count,
                MIN(created_at) AS first_created,
                MAX(updated_at) AS last_updated
            FROM ${OUTBOX_TABLE}
            ${whereClause}
            GROUP BY status, event_type
            ORDER BY status ASC, event_type ASC
        `;

        const latestQuery = `
            SELECT
                id,
                status,
                attempts,
                max_attempts,
                event_type,
                idempotency_key,
                LEFT(COALESCE(last_error, ''), 180) AS last_error,
                available_at,
                updated_at
            FROM ${OUTBOX_TABLE}
            ${whereClause}
            ORDER BY updated_at DESC
            LIMIT $${params.length + 1}
        `;

        const deadReasonParams = [];
        const deadConditions = [`status = 'dead'`];
        if (options.eventType) {
            deadConditions.push(`event_type = $${deadReasonParams.length + 1}`);
            deadReasonParams.push(options.eventType);
        }

        const deadReasonsQuery = `
            SELECT
                event_type,
                LEFT(COALESCE(last_error, '<none>'), 180) AS reason,
                COUNT(*)::int AS count
            FROM ${OUTBOX_TABLE}
            WHERE ${deadConditions.join(' AND ')}
            GROUP BY event_type, LEFT(COALESCE(last_error, '<none>'), 180)
            ORDER BY count DESC, event_type ASC, reason ASC
            LIMIT 30
        `;

        const lagQuery = `
            SELECT
                MIN(CASE WHEN status = 'pending' THEN created_at END) AS oldest_pending_created_at,
                MIN(CASE WHEN status = 'processing' THEN locked_at END) AS oldest_processing_locked_at
            FROM ${OUTBOX_TABLE}
            ${whereClause}
        `;

        const attemptsDistributionQuery = `
            SELECT
                status,
                event_type,
                attempts,
                COUNT(*)::int AS count
            FROM ${OUTBOX_TABLE}
            ${whereClause}
            GROUP BY status, event_type, attempts
            ORDER BY status ASC, event_type ASC, attempts ASC
            LIMIT 200
        `;

        const deadByEventTypeQuery = `
            SELECT
                event_type,
                COUNT(*)::int AS count
            FROM ${OUTBOX_TABLE}
            WHERE status = 'dead'
            GROUP BY event_type
            ORDER BY count DESC, event_type ASC
        `;

        const deadTrendQuery = `
            SELECT
                date_trunc('hour', updated_at) AS hour_bucket,
                event_type,
                COUNT(*)::int AS count
            FROM ${OUTBOX_TABLE}
            WHERE status = 'dead'
              AND updated_at >= NOW() - INTERVAL '24 hours'
            GROUP BY date_trunc('hour', updated_at), event_type
            ORDER BY hour_bucket DESC, event_type ASC
            LIMIT 200
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
            FROM ${OUTBOX_TABLE}
            WHERE status = 'pending'
            GROUP BY
                CASE
                    WHEN NOW() - created_at < INTERVAL '5 minutes' THEN 'lt_5m'
                    WHEN NOW() - created_at < INTERVAL '30 minutes' THEN '5m_to_30m'
                    WHEN NOW() - created_at < INTERVAL '2 hours' THEN '30m_to_2h'
                    ELSE 'gte_2h'
                END
            ORDER BY age_bucket ASC
        `;

        const fileLifecycleQuery = `
            SELECT
                lifecycle_state,
                COUNT(*)::int AS count
            FROM files
            GROUP BY lifecycle_state
            ORDER BY lifecycle_state ASC
        `;

        const [
            summary,
            latest,
            deadReasons,
            lagResult,
            attemptsDistribution,
            deadByEventType,
            deadTrend,
            pendingAgeBuckets,
            fileLifecycle
        ] = await Promise.all([
            db.query(summaryQuery, params),
            db.query(latestQuery, [...params, options.limit]),
            db.query(deadReasonsQuery, deadReasonParams),
            db.query(lagQuery, params),
            db.query(attemptsDistributionQuery, params),
            db.query(deadByEventTypeQuery),
            db.query(deadTrendQuery),
            db.query(pendingAgeBucketsQuery),
            db.query(fileLifecycleQuery).catch((error) => {
                if (error?.code === '42P01') {
                    return { rows: [] };
                }
                throw error;
            })
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

        const payload = {
            filters: {
                status: options.status,
                eventType: options.eventType,
                limit: options.limit
            },
            summary: summary.rows.map((row) => ({
                status: row.status,
                event_type: row.event_type,
                count: row.count,
                first_created: row.first_created,
                last_updated: row.last_updated
            })),
            latest: latest.rows.map((row) => ({
                id: row.id,
                status: row.status,
                attempts: row.attempts,
                max_attempts: row.max_attempts,
                event_type: row.event_type,
                idempotency_key: row.idempotency_key,
                last_error: row.last_error,
                available_at: row.available_at,
                updated_at: row.updated_at
            })),
            deadReasons: deadReasons.rows.map((row) => ({
                event_type: row.event_type,
                reason: row.reason,
                count: row.count
            })),
            operability: {
                oldest_pending_created_at: oldestPendingCreatedAt,
                oldest_pending_age_sec: oldestPendingAgeSec,
                oldest_processing_locked_at: oldestProcessingLockedAt,
                oldest_processing_age_sec: oldestProcessingAgeSec,
                attempts_distribution: attemptsDistribution.rows.map((row) => ({
                    status: row.status,
                    event_type: row.event_type,
                    attempts: row.attempts,
                    count: row.count
                })),
                dead_by_event_type: deadByEventType.rows.map((row) => ({
                    event_type: row.event_type,
                    count: row.count
                })),
                dead_trend_24h: deadTrend.rows.map((row) => ({
                    hour_bucket: row.hour_bucket,
                    event_type: row.event_type,
                    count: row.count
                })),
                pending_age_buckets: pendingAgeBuckets.rows.map((row) => ({
                    age_bucket: row.age_bucket,
                    count: row.count
                })),
                files_lifecycle: fileLifecycle.rows.map((row) => ({
                    lifecycle_state: row.lifecycle_state,
                    count: row.count
                }))
            }
        };

        if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
        }

        console.log('\n=== Side Effect Outbox Summary (status + event_type) ===');
        console.table(payload.summary);

        console.log(`\n=== Side Effect Outbox Latest ${options.limit} Rows ===`);
        console.table(payload.latest);

        console.log('\n=== Side Effect Outbox Dead Letter Reasons ===');
        console.table(payload.deadReasons);

        console.log('\n=== Side Effect Outbox Operability (lag/aging) ===');
        console.table([{
            oldest_pending_created_at: payload.operability.oldest_pending_created_at,
            oldest_pending_age_sec: payload.operability.oldest_pending_age_sec,
            oldest_processing_locked_at: payload.operability.oldest_processing_locked_at,
            oldest_processing_age_sec: payload.operability.oldest_processing_age_sec
        }]);

        console.log('\n=== Side Effect Outbox Attempts Distribution ===');
        console.table(payload.operability.attempts_distribution);

        console.log('\n=== Side Effect Outbox Dead By Event Type ===');
        console.table(payload.operability.dead_by_event_type);

        console.log('\n=== Side Effect Outbox Dead Trend (Last 24h) ===');
        console.table(payload.operability.dead_trend_24h);

        console.log('\n=== Side Effect Outbox Pending Age Buckets ===');
        console.table(payload.operability.pending_age_buckets);

        console.log('\n=== Canonical Files Lifecycle ===');
        console.table(payload.operability.files_lifecycle);
    } catch (error) {
        if (error.code === '42P01') {
            console.log(`\nTable '${OUTBOX_TABLE}' does not exist yet.`);
            return;
        }

        throw error;
    }
};

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to inspect side effect outbox table');
        console.error(error);
        process.exit(1);
    });
