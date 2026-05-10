#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

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

const toPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
};

const parseBooleanEnv = (name, fallback = false) => {
    const raw = process.env[name];
    if (raw === undefined) {
        return fallback;
    }
    return String(raw).toLowerCase() === 'true';
};

const getDeadTotal = (rows = []) => rows
    .filter((row) => row.status === 'dead')
    .reduce((acc, row) => acc + Number(row.count || 0), 0);

const main = async () => {
    loadEnv();
    require('module-alias/register');

    const container = require('@/container');
    const sideEffectOutboxService = container.resolve('sideEffectOutboxService');
    const rabbitmqService = container.resolve('rabbitmqService');
    const commandIdempotencyService = container.resolve('commandIdempotencyService');

    const outboxThresholds = {
        oldestPendingSec: toPositiveInt(process.env.OUTBOX_ALERT_OLDEST_PENDING_SEC, 900),
        oldestProcessingSec: toPositiveInt(process.env.OUTBOX_ALERT_OLDEST_PROCESSING_SEC, 600),
        deadCount: toPositiveInt(process.env.OUTBOX_ALERT_DEAD_COUNT, 50)
    };

    const outboxSnapshot = await sideEffectOutboxService.inspectSummary({});
    const oldestPendingAgeSec = outboxSnapshot.operability?.oldestPendingAgeSec;
    const oldestProcessingAgeSec = outboxSnapshot.operability?.oldestProcessingAgeSec;
    const deadTotal = getDeadTotal(outboxSnapshot.summary || []);

    const rabbitRequired = parseBooleanEnv('RABBIT_CONSUMERS_REQUIRED', process.env.NODE_ENV === 'production');
    const rabbitConfigured = Boolean(process.env.RABBITMQ_URL);
    let rabbitReady = false;
    let rabbitError = null;

    if (rabbitConfigured) {
        await rabbitmqService.connect();
        rabbitReady = Boolean(rabbitmqService.connection && (rabbitmqService.channel || rabbitmqService.confirmChannel));
        if (!rabbitReady) {
            rabbitError = 'Unable to establish RabbitMQ channel connection';
        }
    } else if (rabbitRequired) {
        rabbitError = 'RABBITMQ_URL is required but not configured';
    }

    const idempotencyStatus = commandIdempotencyService.getCleanupStatus
        ? commandIdempotencyService.getCleanupStatus()
        : null;

    const breaches = [];

    if (oldestPendingAgeSec !== null && oldestPendingAgeSec > outboxThresholds.oldestPendingSec) {
        breaches.push({
            component: 'outbox',
            metric: 'oldest_pending_age_sec',
            value: oldestPendingAgeSec,
            threshold: outboxThresholds.oldestPendingSec
        });
    }

    if (oldestProcessingAgeSec !== null && oldestProcessingAgeSec > outboxThresholds.oldestProcessingSec) {
        breaches.push({
            component: 'outbox',
            metric: 'oldest_processing_age_sec',
            value: oldestProcessingAgeSec,
            threshold: outboxThresholds.oldestProcessingSec
        });
    }

    if (deadTotal > outboxThresholds.deadCount) {
        breaches.push({
            component: 'outbox',
            metric: 'dead_total',
            value: deadTotal,
            threshold: outboxThresholds.deadCount
        });
    }

    if (rabbitRequired && !rabbitReady) {
        breaches.push({
            component: 'rabbit',
            metric: 'consumer_readiness',
            value: rabbitReady,
            threshold: true,
            error: rabbitError
        });
    }

    const output = {
        outbox: {
            thresholds: outboxThresholds,
            oldestPendingAgeSec,
            oldestProcessingAgeSec,
            deadTotal
        },
        rabbit: {
            required: rabbitRequired,
            configured: rabbitConfigured,
            ready: rabbitReady,
            error: rabbitError
        },
        idempotency: {
            ready: true,
            status: idempotencyStatus
        },
        breaches
    };

    console.log(JSON.stringify(output, null, 2));

    await rabbitmqService.close?.();

    if (breaches.length > 0) {
        process.exit(2);
    }
};

main().catch((error) => {
    console.error('Ops SLO check failed');
    console.error(error);
    process.exit(1);
});
