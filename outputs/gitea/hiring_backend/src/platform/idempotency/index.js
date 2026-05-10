const crypto = require('node:crypto');
const HttpError = require('@shared/errors/HttpError');

module.exports = ({ commandIdempotencyRepository, logger }) => {
    const parseIntEnv = (name, fallback) => {
        const parsed = Number(process.env[name] || fallback);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };

    const isEnabled = () => String(process.env.COMMAND_IDEMPOTENCY_ENABLED || 'true').toLowerCase() === 'true';
    const getTtlSeconds = () => parseIntEnv('COMMAND_IDEMPOTENCY_TTL_SEC', 86400);
    const getLockTimeoutSec = () => parseIntEnv('COMMAND_IDEMPOTENCY_LOCK_TIMEOUT_SEC', 60);
    const isCleanupEnabled = () => String(process.env.COMMAND_IDEMPOTENCY_CLEANUP_ENABLED || 'true').toLowerCase() === 'true';
    const getCleanupIntervalMs = () => parseIntEnv('COMMAND_IDEMPOTENCY_CLEANUP_INTERVAL_MS', 300000);
    const getCleanupBatchSize = () => parseIntEnv('COMMAND_IDEMPOTENCY_CLEANUP_BATCH_SIZE', 1000);

    let cleanupTimer = null;
    const cleanupState = {
        running: false,
        enabled: isEnabled(),
        cleanupEnabled: isCleanupEnabled(),
        intervalMs: getCleanupIntervalMs(),
        batchSize: getCleanupBatchSize(),
        lastRunAt: null,
        lastDeleted: 0,
        totalDeleted: 0,
        lastError: null
    };

    const hashRequest = ({ method, path, body, params, query, actorId }) => {
        const canonical = JSON.stringify({
            method: String(method || '').toUpperCase(),
            path: path || '',
            body: body || null,
            params: params || null,
            query: query || null,
            actorId: actorId || null
        });

        return crypto.createHash('sha256').update(canonical).digest('hex');
    };

    const execute = async ({
        scope,
        idempotencyKey,
        request,
        ttlSeconds = 86400,
        lockTimeoutSec = 60
    }, handler) => {
        if (!isEnabled() || !idempotencyKey) {
            return handler();
        }

        const requestHash = hashRequest(request || {});
        const effectiveTtl = ttlSeconds || getTtlSeconds();
        const effectiveLockTimeout = lockTimeoutSec || getLockTimeoutSec();

        await commandIdempotencyRepository.reclaimStaleInProgress({
            scope,
            idempotencyKey,
            lockTimeoutSec: effectiveLockTimeout
        });

        let record = await commandIdempotencyRepository.insertInProgress({
            scope,
            idempotencyKey,
            requestHash,
            ttlSeconds: effectiveTtl
        });

        if (!record) {
            record = await commandIdempotencyRepository.findByScopeAndKey({
                scope,
                idempotencyKey
            });

            if (!record) {
                throw new HttpError('Failed to resolve idempotency state', 500);
            }

            if (record.request_hash !== requestHash) {
                throw new HttpError('Idempotency key already used with different request payload', 409);
            }

            if (record.status === 'completed') {
                return {
                    statusCode: record.response_status || 200,
                    body: record.response_body,
                    replayed: true
                };
            }

            if (record.status === 'in_progress') {
                throw new HttpError('Identical request is already being processed', 409);
            }
        }

        try {
            const result = await handler();
            const normalized = {
                statusCode: result?.statusCode || 200,
                body: Object.prototype.hasOwnProperty.call(result || {}, 'body') ? result.body : result
            };

            await commandIdempotencyRepository.markCompleted({
                id: record.id,
                responseStatus: normalized.statusCode,
                responseBody: normalized.body
            });

            return {
                ...normalized,
                replayed: false
            };
        } catch (error) {
            await commandIdempotencyRepository.markFailed({
                id: record.id,
                errorMessage: error.message
            });

            logger.warn('Command idempotency execution failed', {
                scope,
                idempotencyKey,
                error: error.message
            });
            throw error;
        }
    };

    const cleanupExpired = async ({ limit = getCleanupBatchSize() } = {}) => {
        const startedAt = Date.now();
        const stats = await commandIdempotencyRepository.getExpiredStats({});
        const deleted = await commandIdempotencyRepository.deleteExpired({
            limit
        });

        cleanupState.lastRunAt = new Date().toISOString();
        cleanupState.lastDeleted = deleted;
        cleanupState.totalDeleted += deleted;
        cleanupState.lastError = null;
        cleanupState.lastDurationMs = Date.now() - startedAt;
        cleanupState.lastStats = stats;

        if (deleted > 0) {
            logger.info('Expired command idempotency rows cleaned up', {
                deleted,
                durationMs: cleanupState.lastDurationMs
            });
        } else {
            logger.debug('Command idempotency cleanup tick completed', {
                deleted,
                durationMs: cleanupState.lastDurationMs,
                lastRunAt: cleanupState.lastRunAt
            });
        }

        return {
            deleted,
            stats
        };
    };

    const startCleanup = async () => {
        cleanupState.enabled = isEnabled();
        cleanupState.cleanupEnabled = isCleanupEnabled();
        cleanupState.intervalMs = getCleanupIntervalMs();
        cleanupState.batchSize = getCleanupBatchSize();

        if (!cleanupState.enabled || !cleanupState.cleanupEnabled) {
            cleanupState.running = false;
            return false;
        }

        if (cleanupTimer) {
            cleanupState.running = true;
            return true;
        }

        try {
            await cleanupExpired({
                limit: getCleanupBatchSize()
            });
        } catch (error) {
            cleanupState.lastError = error.message;
            logger.warn('Initial command idempotency cleanup failed', {
                error: error.message
            });
        }

        cleanupTimer = setInterval(() => {
            void cleanupExpired({
                limit: getCleanupBatchSize()
            }).catch((error) => {
                cleanupState.lastError = error.message;
                logger.warn('Command idempotency cleanup tick failed', {
                    error: error.message
                });
            });
        }, getCleanupIntervalMs());

        cleanupState.running = true;

        return true;
    };

    const stopCleanup = async () => {
        if (cleanupTimer) {
            clearInterval(cleanupTimer);
            cleanupTimer = null;
        }
        cleanupState.running = false;
    };

    const getCleanupStatus = () => ({
        ...cleanupState
    });

    const getCleanupStats = async () => {
        return commandIdempotencyRepository.getExpiredStats({});
    };

    return {
        execute,
        hashRequest,
        cleanupExpired,
        startCleanup,
        stopCleanup,
        getCleanupStatus,
        getCleanupStats
    };
};
