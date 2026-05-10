module.exports = {
    // PostgreSQL — separate database from dev
    DB_NAME: 'hrdb_test',

    pg: {
        user: process.env.POSTGRES_USER || 'admin',
        password: process.env.POSTGRES_PASSWORD || 'pavel123',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    },

    // SeaweedFS / S3 — separate bucket namespace from dev
    BUCKET_PREFIX: 'test-',
    BASE_BUCKETS: ['cv-uploads', 'attachments', 'documents', 'chat-files', 'templates'],

    // App-level credentials (Read/Write/List — used by services in tests)
    s3: {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:8444',
        accessKey: process.env.S3_ACCESS_KEY || 'app_access_key',
        secretKey: process.env.S3_SECRET_KEY || 'app_secret_key_12345',
    },

    // Admin credentials (Admin action — used only for bucket create/delete in setup/teardown)
    s3Admin: {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:8444',
        accessKey: process.env.S3_ADMIN_ACCESS_KEY || 'admin_access_key',
        secretKey: process.env.S3_ADMIN_SECRET_KEY || 'a_very_long_random_secret_admin_key',
    },
};
