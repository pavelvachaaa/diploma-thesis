const { Pool } = require('pg');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('./config');

let pool;

function getTestDb() {
    if (!pool) {
        pool = new Pool({
            ...config.pg,
            database: config.DB_NAME,
            max: 5,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 5000,
        });
    }

    return {
        query: (text, params) => pool.query(text, params),
        getClient: () => pool.connect(),
    };
}

let storageInstance;

function getTestStorage() {
    if (!storageInstance) {
        const client = new S3Client({
            endpoint: config.s3.endpoint,
            region: 'us-east-1',
            credentials: {
                accessKeyId: config.s3.accessKey,
                secretAccessKey: config.s3.secretKey,
            },
            forcePathStyle: true,
        });

        const prefix = config.BUCKET_PREFIX;
        const toBucket = (name) => prefix + name;

        storageInstance = {
            _client: client,

            // ensureBuckets is handled by globalSetup — no-op here
            async ensureBuckets() {},

            async upload(bucket, key, body, metadata = {}) {
                await client.send(new PutObjectCommand({
                    Bucket: toBucket(bucket),
                    Key: key,
                    Body: body,
                    ContentType: metadata.contentType || 'application/octet-stream',
                    Metadata: metadata.custom || {},
                }));
                return { bucket, key };
            },

            async download(bucket, key) {
                return client.send(new GetObjectCommand({
                    Bucket: toBucket(bucket),
                    Key: key,
                }));
            },

            async delete(bucket, key) {
                await client.send(new DeleteObjectCommand({
                    Bucket: toBucket(bucket),
                    Key: key,
                }));
            },

            init() { /* no-op, already initialized */ },
        };
    }

    return storageInstance;
}

const TABLES_TO_DELETE = [
    'cv_analyses',
    'application_attachments',
    'applicant_status_history',
    'applicant_notes',
    'applicants',
    'job_posting_section_items',
    'job_postings',
    'organization_memberships',
    'users',
];

async function cleanup() {
    const db = getTestDb();
    for (const table of TABLES_TO_DELETE) {
        await db.query(`DELETE FROM ${table}`);
    }
}

async function teardown() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = {
    getTestDb,
    getTestStorage,
    cleanup,
    teardown,
};
