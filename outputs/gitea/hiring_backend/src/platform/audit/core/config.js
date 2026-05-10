const AUDIT_FAILURE_POLICIES = {
    BEST_EFFORT_NON_BLOCKING: 'best_effort_non_blocking'
};

const parseBooleanEnv = (name, fallback) => {
    return (process.env[name] || fallback) === 'true';
};

const parseStateResourceTypes = () => {
    return (process.env.AUDIT_STATE_RESOURCE_TYPES || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
};

const getMaxStateBytes = () => {
    const parsed = Number(process.env.AUDIT_MAX_STATE_BYTES || 16384);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 16384;
};

const getAuditTransport = () => {
    return (process.env.AUDIT_TRANSPORT || 'rabbitmq').toLowerCase();
};

const shouldFallbackToDb = () => {
    return (process.env.AUDIT_FALLBACK_TO_DB || 'false') === 'true';
};

const getAuditFailurePolicy = (logger) => {
    const configuredPolicy = String(
        process.env.AUDIT_FAILURE_POLICY || AUDIT_FAILURE_POLICIES.BEST_EFFORT_NON_BLOCKING
    ).toLowerCase();

    if (configuredPolicy === AUDIT_FAILURE_POLICIES.BEST_EFFORT_NON_BLOCKING) {
        return configuredPolicy;
    }

    logger.warn('Unsupported AUDIT_FAILURE_POLICY value, falling back to best_effort_non_blocking', {
        configured_policy: configuredPolicy
    });

    return AUDIT_FAILURE_POLICIES.BEST_EFFORT_NON_BLOCKING;
};

module.exports = {
    AUDIT_FAILURE_POLICIES,
    parseBooleanEnv,
    parseStateResourceTypes,
    getMaxStateBytes,
    getAuditTransport,
    shouldFallbackToDb,
    getAuditFailurePolicy
};
