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

const getDeadTotal = (rows = []) => {
    return rows
        .filter((row) => row.status === 'dead')
        .reduce((acc, row) => acc + Number(row.count || 0), 0);
};

const main = async () => {
    loadEnv();
    require('module-alias/register');

    const container = require('@/container');
    const service = container.resolve('sideEffectOutboxService');

    const thresholds = {
        oldestPendingSec: toPositiveInt(process.env.OUTBOX_ALERT_OLDEST_PENDING_SEC, 900),
        oldestProcessingSec: toPositiveInt(process.env.OUTBOX_ALERT_OLDEST_PROCESSING_SEC, 600),
        deadCount: toPositiveInt(process.env.OUTBOX_ALERT_DEAD_COUNT, 50)
    };

    const snapshot = await service.inspectSummary({});
    const oldestPendingAgeSec = snapshot.operability?.oldestPendingAgeSec;
    const oldestProcessingAgeSec = snapshot.operability?.oldestProcessingAgeSec;
    const deadTotal = getDeadTotal(snapshot.summary || []);

    const breaches = [];
    if (oldestPendingAgeSec !== null && oldestPendingAgeSec > thresholds.oldestPendingSec) {
        breaches.push({
            metric: 'oldest_pending_age_sec',
            value: oldestPendingAgeSec,
            threshold: thresholds.oldestPendingSec
        });
    }

    if (oldestProcessingAgeSec !== null && oldestProcessingAgeSec > thresholds.oldestProcessingSec) {
        breaches.push({
            metric: 'oldest_processing_age_sec',
            value: oldestProcessingAgeSec,
            threshold: thresholds.oldestProcessingSec
        });
    }

    if (deadTotal > thresholds.deadCount) {
        breaches.push({
            metric: 'dead_total',
            value: deadTotal,
            threshold: thresholds.deadCount
        });
    }

    const output = {
        thresholds,
        snapshot: {
            oldestPendingAgeSec,
            oldestProcessingAgeSec,
            deadTotal
        },
        breaches
    };

    console.log(JSON.stringify(output, null, 2));

    if (breaches.length > 0) {
        process.exit(2);
    }
};

main().catch((error) => {
    console.error('Outbox SLO check failed');
    console.error(error);
    process.exit(1);
});
