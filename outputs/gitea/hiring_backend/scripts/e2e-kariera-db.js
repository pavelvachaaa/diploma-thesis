#!/usr/bin/env node
require('module-alias/register');

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const ROOT_DIR = path.resolve(__dirname, '..');
const E2E_DB_NAME = process.env.E2E_POSTGRES_DB || 'hrdb_e2e';
const SEED_FILE = path.join(ROOT_DIR, 'src/database/seed/kariera_e2e.sql');

function loadEnv() {
    for (const fileName of ['.env.local', '.env']) {
        const filePath = path.join(ROOT_DIR, fileName);
        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath, override: false });
        }
    }

    process.env.POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
    process.env.POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
    process.env.POSTGRES_USER = process.env.POSTGRES_USER || 'admin';
    process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'pavel123';
}

function quoteIdentifier(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

function createPool(database) {
    return new Pool({
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT || 5432),
        database,
        max: 3,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 1000,
    });
}

async function waitForPostgres() {
    const attempts = Number(process.env.E2E_POSTGRES_WAIT_ATTEMPTS || 30);
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const pool = createPool('postgres');
        try {
            await pool.query('SELECT 1');
            await pool.end();
            return;
        } catch (error) {
            lastError = error;
            await pool.end().catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    throw new Error(`PostgreSQL did not become ready: ${lastError?.message || 'unknown error'}`);
}

async function resetDatabase() {
    const adminPool = createPool('postgres');
    const quotedDbName = quoteIdentifier(E2E_DB_NAME);

    try {
        await adminPool.query(
            `SELECT pg_terminate_backend(pid)
             FROM pg_stat_activity
             WHERE datname = $1
               AND pid <> pg_backend_pid()`,
            [E2E_DB_NAME]
        );
        await adminPool.query(`DROP DATABASE IF EXISTS ${quotedDbName}`);
        await adminPool.query(`CREATE DATABASE ${quotedDbName}`);
    } finally {
        await adminPool.end();
    }
}

function migrationEnv() {
    return {
        ...process.env,
        NODE_ENV: 'test',
        APP_ENV: 'test',
        POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
        POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
        POSTGRES_DB: E2E_DB_NAME,
        LOG_LEVEL: process.env.LOG_LEVEL || 'warn',
        LOG_QUERY: 'false',
        AUDIT_ENABLED: 'false',
        RABBITMQ_URL: '',
        RABBIT_CONSUMERS_REQUIRED: 'false',
        SIDE_EFFECT_OUTBOX_ENABLED: 'true',
        SIDE_EFFECT_OUTBOX_WORKER_ENABLED: 'true',
        SIDE_EFFECT_OUTBOX_POLL_INTERVAL_MS: '600000',
    };
}

function runMigrations() {
    execFileSync(process.execPath, ['src/database/migrate.js'], {
        cwd: ROOT_DIR,
        env: migrationEnv(),
        stdio: 'inherit',
    });
}

async function seedDatabase() {
    const pool = createPool(E2E_DB_NAME);
    try {
        const sql = fs.readFileSync(SEED_FILE, 'utf8');
        await pool.query(sql);
    } finally {
        await pool.end();
    }
}

async function verifySeed() {
    const pool = createPool(E2E_DB_NAME);
    try {
        const { rows } = await pool.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE title LIKE 'E2E %'
                      AND status = 'active'
                      AND (publish_date IS NULL OR publish_date <= timezone('Europe/Prague', now())::date)
                )::int AS active_public_jobs,
                COUNT(*) FILTER (WHERE id = '11111111-1111-4111-8111-111111111111')::int AS cv_job_count,
                COUNT(*) FILTER (WHERE id = '22222222-2222-4222-8222-222222222222')::int AS no_cv_job_count
            FROM job_postings_with_status
        `);

        const result = rows[0];
        if (result.active_public_jobs !== 9 || result.cv_job_count !== 1 || result.no_cv_job_count !== 1) {
            throw new Error(`Unexpected E2E seed verification result: ${JSON.stringify(result)}`);
        }

        console.log(`[e2e-kariera-db] verified ${result.active_public_jobs} public jobs in ${E2E_DB_NAME}`);
    } finally {
        await pool.end();
    }
}

async function main() {
    loadEnv();
    const command = process.argv[2] || 'reset';

    if (command === 'reset') {
        await waitForPostgres();
        await resetDatabase();
        runMigrations();
        await seedDatabase();
        await verifySeed();
        return;
    }

    if (command === 'seed') {
        await seedDatabase();
        await verifySeed();
        return;
    }

    if (command === 'verify') {
        await verifySeed();
        return;
    }

    throw new Error(`Unknown command "${command}". Use reset, seed, or verify.`);
}

main().catch((error) => {
    console.error(`[e2e-kariera-db] ${error.message}`);
    process.exit(1);
});
