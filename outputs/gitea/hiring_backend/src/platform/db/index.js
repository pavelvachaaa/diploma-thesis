const { Pool } = require('pg');

const parseBooleanEnv = (name, fallback) => {
    const value = process.env[name];
    if (value === undefined) return fallback;
    return value === 'true';
};

module.exports = ({ logger }) => {
    const includeStack = parseBooleanEnv('LOG_INCLUDE_STACK', process.env.NODE_ENV !== 'production');

    const pool = new Pool({
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    });

    const shouldLogQueries = parseBooleanEnv('LOG_QUERY', false);

    const getOperationType = (text = '') => {
        if (typeof text !== 'string') return 'unknown';
        const normalized = text.trim().split(/\s+/)[0] || 'unknown';
        return normalized.toLowerCase();
    };

    pool.on('error', (err) => {
        logger.error('PostgreSQL pool error', {
            error: err.message,
            code: err.code || null,
            stack: includeStack ? err.stack : undefined
        });
    });

    const query = async (text, params) => {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        if (shouldLogQueries) {
            logger.debug('Executed database query', {
                operation: getOperationType(text),
                duration_ms: duration,
                rows: res.rowCount
            });
        }

        return res;
    };

    const getClient = async () => {
        const client = await pool.connect();
        const originalQuery = client.query;
        const release = client.release;

        const timeout = setTimeout(() => {
            logger.error('A database client has been checked out for more than 5 seconds');
        }, 5000);

        client.query = (...args) => originalQuery.apply(client, args);

        client.release = () => {
            clearTimeout(timeout);
            client.query = originalQuery;
            client.release = release;
            return release.apply(client);
        };

        return client;
    };

    return {
        query,
        getClient,
        pool
    };
};
