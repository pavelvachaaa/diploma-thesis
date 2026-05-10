module.exports = () => {
    const parseIntEnv = (name, fallback) => {
        const parsed = Number(process.env[name] || fallback);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };

    const parseBooleanEnv = (name, fallback = 'false') => {
        return String(process.env[name] || fallback).toLowerCase() === 'true';
    };

    const isEnabled = () => parseBooleanEnv('SIDE_EFFECT_OUTBOX_ENABLED', 'true');
    const isWorkerEnabled = () => isEnabled() && parseBooleanEnv('SIDE_EFFECT_OUTBOX_WORKER_ENABLED', 'true');

    const getBatchSize = () => parseIntEnv('SIDE_EFFECT_OUTBOX_BATCH_SIZE', 20);
    const getPollIntervalMs = () => parseIntEnv('SIDE_EFFECT_OUTBOX_POLL_INTERVAL_MS', 2000);
    const getLockTimeoutSeconds = () => parseIntEnv('SIDE_EFFECT_OUTBOX_LOCK_TIMEOUT_SEC', 120);
    const getMaxAttempts = () => parseIntEnv('SIDE_EFFECT_OUTBOX_MAX_ATTEMPTS', 8);
    const getRetryBaseMs = () => parseIntEnv('SIDE_EFFECT_OUTBOX_RETRY_BASE_MS', 1000);
    const getRetryMaxMs = () => parseIntEnv('SIDE_EFFECT_OUTBOX_RETRY_MAX_MS', 300000);
    const getInlineAttachmentMaxBytes = () => parseIntEnv('SIDE_EFFECT_OUTBOX_INLINE_ATTACHMENT_MAX_BYTES', 262144);

    return {
        parseIntEnv,
        parseBooleanEnv,
        isEnabled,
        isWorkerEnabled,
        getBatchSize,
        getPollIntervalMs,
        getLockTimeoutSeconds,
        getMaxAttempts,
        getRetryBaseMs,
        getRetryMaxMs,
        getInlineAttachmentMaxBytes
    };
};
