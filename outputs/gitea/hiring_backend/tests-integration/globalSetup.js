const { Pool } = require('pg');
const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const config = require('./config');

module.exports = async () => {
    // ── PostgreSQL: create isolated test database ──
    const adminPool = new Pool({ ...config.pg, database: 'postgres' });

    try {
        await adminPool.query(`DROP DATABASE IF EXISTS ${config.DB_NAME}`);
        await adminPool.query(`CREATE DATABASE ${config.DB_NAME}`);
        console.log(`[globalSetup] Created database ${config.DB_NAME}`);
    } finally {
        await adminPool.end();
    }

    // Run migrations against the test database
    const testPool = new Pool({ ...config.pg, database: config.DB_NAME });

    try {
        await testPool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const filename of migrationFiles) {
            const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
            const isConcurrent = /CONCURRENTLY/i.test(sql);

            const client = await testPool.connect();
            try {
                if (!isConcurrent) {
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
                    await client.query('COMMIT');
                } else {
                    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
                    for (const statement of statements) {
                        await client.query(statement);
                    }
                    await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
                }
                console.log(`[globalSetup] Migration ${filename} executed`);
            } catch (err) {
                if (!isConcurrent) {
                    await client.query('ROLLBACK');
                }
                console.error(`[globalSetup] Migration ${filename} failed:`, err.message);
                throw err;
            } finally {
                client.release();
            }
        }

        console.log(`[globalSetup] All migrations completed on ${config.DB_NAME}`);
    } finally {
        await testPool.end();
    }

    // ── S3: create isolated test buckets (requires Admin action) ──
    const s3Client = new S3Client({
        endpoint: config.s3Admin.endpoint,
        region: 'us-east-1',
        credentials: { accessKeyId: config.s3Admin.accessKey, secretAccessKey: config.s3Admin.secretKey },
        forcePathStyle: true,
    });

    for (const base of config.BASE_BUCKETS) {
        const bucket = config.BUCKET_PREFIX + base;
        try {
            await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
            console.log(`[globalSetup] Created S3 bucket ${bucket}`);
        } catch (err) {
            // Bucket already exists — safe to ignore
            if (err.name !== 'BucketAlreadyOwnedByYou' && err.name !== 'BucketAlreadyExists') {
                console.warn(`[globalSetup] Bucket ${bucket} creation warning: ${err.message}`);
            }
        }
    }
    console.log(`[globalSetup] S3 test buckets verified (prefix: ${config.BUCKET_PREFIX})`);

    s3Client.destroy();
};
