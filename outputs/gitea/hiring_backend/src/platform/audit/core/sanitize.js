const {
    getMaxStateBytes,
    parseBooleanEnv,
    parseStateResourceTypes
} = require('./config');

const safeJson = (value, fallback) => {
    if (value === undefined) return fallback;
    return value;
};

const SENSITIVE_KEYS = new Set([
    'password',
    'plainpassword',
    'token',
    'auth_token',
    'authorization',
    'jwt',
    'jwt_secret',
    'email_password',
    's3_secret_key',
    'secret'
]);

const sanitizeForAudit = (value, depth = 0) => {
    if (value === null || value === undefined) return value;
    if (depth > 6) return '[max-depth]';

    if (typeof value === 'string') {
        return value.length > 2000 ? `${value.slice(0, 2000)}...[truncated]` : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        const sliced = value.slice(0, 50).map((item) => sanitizeForAudit(item, depth + 1));
        if (value.length > 50) {
            sliced.push('[truncated]');
        }
        return sliced;
    }

    if (Buffer.isBuffer(value)) {
        return `[buffer:${value.length}]`;
    }

    if (typeof value === 'object') {
        const out = {};
        const entries = Object.entries(value).slice(0, 100);
        for (const [key, v] of entries) {
            if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
                out[key] = '[redacted]';
                continue;
            }
            out[key] = sanitizeForAudit(v, depth + 1);
        }
        if (Object.keys(value).length > 100) {
            out.__truncated__ = true;
        }
        return out;
    }

    return String(value);
};

const summarizeState = (state) => {
    if (state === null || state === undefined) return null;

    if (Array.isArray(state)) {
        return {
            __summary: 'array',
            length: state.length
        };
    }

    if (typeof state === 'object') {
        return {
            __summary: 'object',
            keys: Object.keys(state).slice(0, 40),
            keyCount: Object.keys(state).length
        };
    }

    return {
        __summary: typeof state
    };
};

const enforceStateSizeLimit = (state) => {
    if (!state) return state;

    const maxBytes = getMaxStateBytes();
    try {
        const serialized = JSON.stringify(state);
        const bytes = Buffer.byteLength(serialized, 'utf8');
        if (bytes <= maxBytes) {
            return state;
        }

        return {
            __truncated: true,
            __reason: 'max_state_bytes_exceeded',
            __maxBytes: maxBytes,
            __actualBytes: bytes,
            __snapshot: summarizeState(state)
        };
    } catch (error) {
        return {
            __truncated: true,
            __reason: 'serialization_failed',
            __error: error.message
        };
    }
};

const shouldCaptureState = (event, resourceType, status) => {
    if (event.captureState === false) {
        return false;
    }

    if (event.captureState === true) {
        return true;
    }

    const includeState = parseBooleanEnv('AUDIT_INCLUDE_STATE', 'true');
    if (!includeState) {
        return false;
    }

    const includeStateOnFailure = parseBooleanEnv('AUDIT_INCLUDE_STATE_ON_FAILURE', 'false');
    if (status === 'failure' && !includeStateOnFailure) {
        return false;
    }

    const resourceTypes = parseStateResourceTypes();
    if (resourceTypes.length === 0) {
        return true;
    }

    return !!resourceType && resourceTypes.includes(resourceType);
};

module.exports = {
    safeJson,
    sanitizeForAudit,
    enforceStateSizeLimit,
    shouldCaptureState
};
