const HEADER_CANDIDATES = ['Idempotency-Key', 'idempotency-key', 'X-Idempotency-Key', 'x-idempotency-key'];

const normalizeScopeSegment = (value) => {
    return String(value || '')
        .replace(/[{}:]/g, '')
        .replace(/[^a-zA-Z0-9/_-]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '')
        .replace(/\//g, '.');
};

const resolveScope = ({ req, explicitScope }) => {
    if (explicitScope) {
        return explicitScope;
    }

    const method = String(req?.method || 'unknown').toLowerCase();
    const routePath = req?.route?.path || req?.path || req?.originalUrl || 'unknown';
    const normalizedPath = normalizeScopeSegment(routePath);
    return normalizedPath ? `${method}.${normalizedPath}` : method;
};

const resolveIdempotencyKey = (req) => {
    if (!req || typeof req.get !== 'function') {
        return null;
    }

    for (const header of HEADER_CANDIDATES) {
        const value = req.get(header);
        if (value) {
            return String(value).trim();
        }
    }

    return null;
};

module.exports = {
    resolveScope,
    resolveIdempotencyKey
};
