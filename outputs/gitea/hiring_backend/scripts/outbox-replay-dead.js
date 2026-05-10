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

loadEnv();

require('module-alias/register');

const container = require('@/container');

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const toPositiveInt = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), max);
};

const parseArgs = (argv = []) => {
    const options = {
        execute: false,
        ids: [],
        eventType: null,
        limit: DEFAULT_LIMIT,
        json: false
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === '--execute') {
            options.execute = true;
            continue;
        }

        if (arg === '--json') {
            options.json = true;
            continue;
        }

        if (arg === '--ids' && argv[i + 1]) {
            options.ids = argv[i + 1]
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean);
            i += 1;
            continue;
        }

        if (arg.startsWith('--ids=')) {
            options.ids = arg
                .slice('--ids='.length)
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean);
            continue;
        }

        if (arg === '--event-type' && argv[i + 1]) {
            options.eventType = argv[i + 1].trim() || null;
            i += 1;
            continue;
        }

        if (arg.startsWith('--event-type=')) {
            options.eventType = arg.slice('--event-type='.length).trim() || null;
            continue;
        }

        if (arg === '--limit' && argv[i + 1]) {
            options.limit = toPositiveInt(argv[i + 1], DEFAULT_LIMIT, MAX_LIMIT);
            i += 1;
            continue;
        }

        if (arg.startsWith('--limit=')) {
            options.limit = toPositiveInt(arg.slice('--limit='.length), DEFAULT_LIMIT, MAX_LIMIT);
        }
    }

    return options;
};

const options = parseArgs(process.argv.slice(2));

const run = async () => {
    const sideEffectOutboxService = container.resolve('sideEffectOutboxService');
    const selection = {
        ids: options.ids,
        eventType: options.eventType,
        limit: options.limit
    };

    const operationOptions = {
        actorUserId: null,
        actorEmail: 'outbox-cli',
        actorRoles: ['system'],
        source: 'outbox-cli'
    };

    const result = options.execute
        ? await sideEffectOutboxService.replayDead(selection, operationOptions)
        : await sideEffectOutboxService.previewReplayDead(selection, operationOptions);

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    const modeLabel = options.execute ? 'EXECUTE' : 'PREVIEW';
    console.log(`\n=== Side Effect Outbox Dead Replay (${modeLabel}) ===`);
    console.log(`Matched: ${result.matchedCount} | Replayed: ${result.replayedCount}`);
    console.log(`Filter: eventType=${selection.eventType || '<any>'}, ids=${selection.ids.length}, limit=${selection.limit}`);

    if (Array.isArray(result.events) && result.events.length > 0) {
        console.log('\nEvents:');
        console.table(result.events);
    } else {
        console.log('\nNo dead events matched the selector.');
    }

    if (!options.execute) {
        console.log('\nPreview mode only. Re-run with --execute to move matched dead events back to pending.');
    }
};

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to replay dead side effect outbox events');
        console.error(error);
        process.exit(1);
    });
