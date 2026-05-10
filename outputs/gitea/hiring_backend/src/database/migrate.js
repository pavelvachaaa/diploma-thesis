require('module-alias/register');

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const createDb = require('@platform/db');
const logger = require('@platform/logger').child({ module: 'migrate' });

const loadEnv = () => {
    if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DB && process.env.POSTGRES_PASSWORD) {
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
const db = createDb({ logger });

async function createMigrationsTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

    try {
        await db.query(query);
        logger.info('Migrations table created or already exists');
    } catch (error) {
        logger.error({ err: error }, 'Failed to create migrations table');
        throw error;
    }
}

async function getExecutedMigrations() {
    try {
        const result = await db.query('SELECT filename FROM migrations ORDER BY id');
        return result.rows.map(row => row.filename);
    } catch (error) {
        logger.error({ err: error }, 'Failed to get executed migrations');
        throw error;
    }
}

async function executeMigration(filename, sql) {
    const client = await db.getClient();

    // Check if the SQL file contains CONCURRENTLY (case-insensitive)
    const isConcurrent = /CONCURRENTLY/i.test(sql);

    try {
        if (!isConcurrent) {
            // STANDARD MIGRATION (Transactional)
            await client.query('BEGIN');
            logger.info({ filename }, 'Starting transaction for migration');

            // Execute the whole file as one block
            await client.query(sql);

            await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
            await client.query('COMMIT');

        } else {
            // CONCURRENT MIGRATION (Non-Transactional / Split Statements)
            logger.info({ filename }, 'Running migration in AUTOCOMMIT mode (CONCURRENTLY detected)');

            // 1. Split the file into individual statements to avoid implicit transaction blocks
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            // 2. Execute statements sequentially
            for (const statement of statements) {
                await client.query(statement);
            }

            // 3. Mark as done
            await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        }

        logger.info({ filename }, 'Migration executed successfully');
    } catch (error) {
        if (!isConcurrent) {
            await client.query('ROLLBACK');
        }
        // Note: We cannot ROLLBACK concurrent indexes. If it fails halfway, 
        // you may need to manually DROP the invalid index in the DB.
        logger.error({ err: error, filename }, 'Migration failed');
        throw error;
    } finally {
        client.release();
    }
}

async function runMigrations() {
    try {
        logger.info('Starting database migrations...');

        // Ensure migrations table exists
        await createMigrationsTable();

        // Get list of executed migrations
        const executedMigrations = await getExecutedMigrations();

        // Read migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        // Execute pending migrations
        for (const filename of migrationFiles) {
            if (!executedMigrations.includes(filename)) {
                const filePath = path.join(migrationsDir, filename);
                const sql = fs.readFileSync(filePath, 'utf8');

                logger.info({ filename }, 'Executing migration');
                await executeMigration(filename, sql);
            } else {
                logger.debug({ filename }, 'Migration already executed, skipping');
            }
        }

        logger.info('Database migrations completed successfully');
    } catch (error) {
        logger.error({ err: error }, 'Database migrations failed');
        throw error;
    }
}

if (require.main === module) {
    runMigrations()
        .then(() => {
            logger.info('Migrations completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error({ err: error }, 'Migrations failed');
            process.exit(1);
        });
}

module.exports = { runMigrations };
