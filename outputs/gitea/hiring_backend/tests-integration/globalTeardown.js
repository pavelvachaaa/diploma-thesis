const { Pool } = require('pg');
const { S3Client, DeleteBucketCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const config = require('./config');

module.exports = async () => {
    const adminPool = new Pool({ ...config.pg, database: 'postgres' });

    try {
        await adminPool.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${config.DB_NAME}' AND pid <> pg_backend_pid()
        `);
        await adminPool.query(`DROP DATABASE IF EXISTS ${config.DB_NAME}`);
        console.log(`[globalTeardown] Dropped database ${config.DB_NAME}`);
    } finally {
        await adminPool.end();
    }

    const s3Client = new S3Client({
        endpoint: config.s3.endpoint,
        region: 'us-east-1',
        credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
        forcePathStyle: true,
    });

    for (const base of config.BASE_BUCKETS) {
        const bucket = config.BUCKET_PREFIX + base;
        try {
            // Empty the bucket first (DeleteBucket requires empty bucket)
            const listed = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket }));
            if (listed.Contents && listed.Contents.length > 0) {
                await s3Client.send(new DeleteObjectsCommand({
                    Bucket: bucket,
                    Delete: { Objects: listed.Contents.map(o => ({ Key: o.Key })) },
                }));
            }
            await s3Client.send(new DeleteBucketCommand({ Bucket: bucket }));
            console.log(`[globalTeardown] Deleted S3 bucket ${bucket}`);
        } catch (err) {
            if (err.name !== 'NoSuchBucket' && err.$metadata?.httpStatusCode !== 404) {
                console.warn(`[globalTeardown] Could not delete bucket ${bucket}: ${err.message}`);
            }
        }
    }

    s3Client.destroy();
};
