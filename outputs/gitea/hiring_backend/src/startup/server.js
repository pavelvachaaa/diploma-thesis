const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runtimeStatus = {
    startedAt: null,
    db: {
        ready: false,
        lastCheckedAt: null,
        lastError: null
    },
    outboxWorker: {
        ready: false,
        workers: {}
    },
    rabbitConsumers: {
        required: false,
        configured: false,
        ready: true,
        consumers: [],
        lastCheckedAt: null,
        lastError: null
    },
    idempotencyCleanup: {
        ready: false,
        running: false,
        enabled: false,
        lastRunAt: null,
        lastDeleted: 0,
        lastError: null
    }
};

const parseBooleanEnv = (name, fallback = false) => {
    const raw = process.env[name];
    if (raw === undefined) {
        return fallback;
    }
    return String(raw).toLowerCase() === 'true';
};

const areRabbitConsumersRequired = () => {
    return parseBooleanEnv('RABBIT_CONSUMERS_REQUIRED', process.env.NODE_ENV === 'production');
};

const getRuntimeStatus = () => JSON.parse(JSON.stringify(runtimeStatus));

const getReadinessStatus = () => {
    const status = getRuntimeStatus();
    const ready = status.db.ready
        && status.outboxWorker.ready
        && status.rabbitConsumers.ready
        && status.idempotencyCleanup.ready;

    return {
        ready,
        status: ready ? 'ready' : 'degraded',
        components: {
            db: status.db,
            outboxWorker: status.outboxWorker,
            rabbitConsumers: status.rabbitConsumers,
            idempotencyCleanup: status.idempotencyCleanup
        }
    };
};

const initDbWithRetry = async ({ db, logger, retries = 5, delay = 2000 }) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger.info('Attempting DB connection', { attempt, retries });
            await db.query('SELECT 1');
            logger.info('Database connection established');
            runtimeStatus.db = {
                ready: true,
                lastCheckedAt: new Date().toISOString(),
                lastError: null
            };
            return;
        } catch (error) {
            logger.error('DB connection attempt failed', {
                attempt,
                retries,
                error: error.message
            });
            runtimeStatus.db = {
                ready: false,
                lastCheckedAt: new Date().toISOString(),
                lastError: error.message
            };

            if (attempt === retries) {
                throw error;
            }

            await wait(delay);
        }
    }
};

const initStorageBuckets = async ({ container, logger }) => {
    try {
        const storageService = container.resolve('storageService');
        await storageService.ensureBuckets();
    } catch (error) {
        logger.warn('Failed to initialize storage buckets (SeaweedFS may not be available)', {
            error: error.message
        });
    }
};

const startRabbitConsumers = async ({ container, logger }) => {
    const required = areRabbitConsumersRequired();
    const configured = Boolean(process.env.RABBITMQ_URL);
    runtimeStatus.rabbitConsumers.required = required;
    runtimeStatus.rabbitConsumers.configured = configured;
    runtimeStatus.rabbitConsumers.consumers = [];
    runtimeStatus.rabbitConsumers.lastCheckedAt = new Date().toISOString();
    runtimeStatus.rabbitConsumers.lastError = null;

    if (!configured) {
        const message = 'RABBITMQ_URL not set, skipping AI consumers';
        logger.info(message);
        runtimeStatus.rabbitConsumers.ready = !required;
        if (required) {
            runtimeStatus.rabbitConsumers.lastError = 'RABBITMQ_URL is required but not configured';
            throw new Error('Rabbit consumers are required but RABBITMQ_URL is not configured');
        }
        return runtimeStatus.rabbitConsumers;
    }

    const consumers = [
        { token: 'cvAnalysisConsumerService', name: 'CV analysis consumer' },
        { token: 'jobSeekerCvConsumerService', name: 'job seeker CV analysis consumer' },
        { token: 'jobEmbeddingsConsumerService', name: 'job embeddings consumer' }
    ];

    let hasFailure = false;

    for (const consumer of consumers) {
        try {
            const instance = container.resolve(consumer.token);
            await instance.start();
            logger.info(`Started ${consumer.name}`);
            runtimeStatus.rabbitConsumers.consumers.push({
                token: consumer.token,
                name: consumer.name,
                ready: true,
                error: null
            });
        } catch (error) {
            logger.warn(`Failed to start ${consumer.name}`, { error: error.message });
            runtimeStatus.rabbitConsumers.consumers.push({
                token: consumer.token,
                name: consumer.name,
                ready: false,
                error: error.message
            });
            hasFailure = true;
        }
    }

    runtimeStatus.rabbitConsumers.ready = !hasFailure;
    runtimeStatus.rabbitConsumers.lastCheckedAt = new Date().toISOString();
    runtimeStatus.rabbitConsumers.lastError = hasFailure
        ? 'One or more Rabbit consumers failed to start'
        : null;

    if (required && hasFailure) {
        throw new Error('Rabbit consumers are required and at least one consumer failed to start');
    }

    return runtimeStatus.rabbitConsumers;
};

const startOutboxWorkers = async ({ container, logger }) => {
    const workerDefinitions = [
        {
            token: 'sideEffectOutboxService',
            label: 'side-effect'
        }
    ];

    const status = {};

    for (const worker of workerDefinitions) {
        const service = container.resolve(worker.token);
        const isEnabled = service.isEnabled?.() === true;
        const isWorkerEnabled = service.isWorkerEnabled?.() === true;

        if (!isEnabled || !isWorkerEnabled) {
            throw new Error(
                `${worker.label} outbox must be enabled (SIDE_EFFECT_OUTBOX_ENABLED=true and SIDE_EFFECT_OUTBOX_WORKER_ENABLED=true)`
            );
        }

        const started = await service.start();

        if (!started) {
            throw new Error(`${worker.label} outbox worker failed to start`);
        }

        status[worker.label] = started;
        logger.info(`Started ${worker.label} outbox worker`);
    }

    runtimeStatus.outboxWorker = {
        ready: Object.values(status).every(Boolean),
        workers: status
    };

    return {
        ...status,
        any: Object.values(status).some(Boolean)
    };
};

const startRebacReconciler = async ({ container, logger }) => {
    try {
        const rebacService = container.resolve('rebacService');
        const started = await rebacService.start?.();

        if (started) {
            logger.info('Started ReBAC reconciler');
        }

        return Boolean(started);
    } catch (error) {
        logger.warn('Failed to start ReBAC reconciler', {
            error: error.message
        });
        return false;
    }
};

const startCommandIdempotencyCleanup = async ({ container, logger }) => {
    const commandIdempotencyService = container.resolve('commandIdempotencyService');
    const started = await commandIdempotencyService.startCleanup?.();
    const cleanupStatus = commandIdempotencyService.getCleanupStatus?.() || null;

    if (started) {
        logger.info('Started command idempotency cleanup scheduler');
    } else {
        logger.info('Command idempotency cleanup scheduler is disabled');
    }

    runtimeStatus.idempotencyCleanup = {
        ready: cleanupStatus ? (cleanupStatus.enabled ? cleanupStatus.running : true) : Boolean(started),
        running: cleanupStatus?.running || false,
        enabled: cleanupStatus?.enabled || false,
        lastRunAt: cleanupStatus?.lastRunAt || null,
        lastDeleted: cleanupStatus?.lastDeleted || 0,
        lastError: cleanupStatus?.lastError || null
    };

    return runtimeStatus.idempotencyCleanup;
};

const startServer = async ({
    app,
    db,
    container,
    logger,
    port = Number(process.env.INTERNAL_PORT || 3322),
    dbRetries = 5,
    dbRetryDelay = 2000
}) => {
    runtimeStatus.startedAt = new Date().toISOString();
    await initDbWithRetry({
        db,
        logger,
        retries: dbRetries,
        delay: dbRetryDelay
    });

    await initStorageBuckets({ container, logger });
    await startOutboxWorkers({ container, logger });
    await startRebacReconciler({ container, logger });
    await startRabbitConsumers({ container, logger });
    await startCommandIdempotencyCleanup({ container, logger });

    try {
        const metrics = require('@platform/metrics');
        metrics.startBackgroundRefresh({
            outboxService: container.resolve('sideEffectOutboxService'),
            getRuntimeStatus,
            dbPool: db.pool,
            logger
        });
    } catch (error) {
        logger.warn('Failed to start metrics background refresh', { error: error.message });
    }

    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            logger.info('Server running', {
                port,
                logLevel: process.env.LOG_LEVEL,
                environment: process.env.NODE_ENV || 'development'
            });
            resolve(server);
        });

        server.on('error', reject);
    });
};

module.exports = {
    getRuntimeStatus,
    getReadinessStatus,
    areRabbitConsumersRequired,
    initDbWithRetry,
    initStorageBuckets,
    startOutboxWorkers,
    startRebacReconciler,
    startCommandIdempotencyCleanup,
    startRabbitConsumers,
    startServer
};
