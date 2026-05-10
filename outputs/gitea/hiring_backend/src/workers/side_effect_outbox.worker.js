// Setup module aliases - MUST be first
require('module-alias/register');

const container = require('@/container');
const logger = require('@platform/logger');
const { initDbWithRetry, startOutboxWorkers, startRebacReconciler } = require('@/startup/server');
const db = container.resolve('db');

let isShuttingDown = false;

const shutdown = async (signal) => {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;

    logger.info('Shutting down side effect outbox worker process', { signal });

    try {
        const sideEffectOutboxService = container.resolve('sideEffectOutboxService');
        await sideEffectOutboxService.stop();
    } catch (error) {
        logger.warn('Failed to stop side effect outbox worker cleanly', {
            error: error.message
        });
    }

    try {
        const rebacService = container.resolve('rebacService');
        await rebacService.stop?.();
    } catch (error) {
        logger.warn('Failed to stop ReBAC reconciler cleanly', {
            error: error.message
        });
    }

    process.exit(0);
};

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

void (async () => {
    await initDbWithRetry({
        db,
        logger
    });

    const started = await startOutboxWorkers({
        container,
        logger
    });

    await startRebacReconciler({
        container,
        logger
    });

    if (!started.any) {
        logger.warn('Side effect outbox worker is disabled by configuration. Exiting worker process.');
        process.exit(0);
    }

    logger.info('Side effect outbox worker process started', started);
})().catch((error) => {
    logger.fatal('Side effect outbox worker startup failed', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});
