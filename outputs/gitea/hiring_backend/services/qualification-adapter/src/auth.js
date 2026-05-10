const { timingSafeEqual } = require('node:crypto');

const parseBearerToken = (headerValue) => {
    if (!headerValue || typeof headerValue !== 'string') {
        return null;
    }

    const [scheme, token] = headerValue.split(/\s+/);
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
        return null;
    }

    return token.trim();
};

const safeCompare = (left, right) => {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
};

const createInternalAuthMiddleware = ({ expectedToken, logger = null }) => (req, res, next) => {
    const providedToken = parseBearerToken(req.headers.authorization);
    if (!providedToken || !safeCompare(providedToken, expectedToken)) {
        if (logger && typeof logger.warn === 'function') {
            logger.warn('Qualification adapter auth rejected', {
                endpoint: req.path,
                method: req.method,
                request_id: req.headers['x-request-id'] || req.headers['request-id'] || null,
                reason_code: 'QUAL_ADAPTER_UNAUTHORIZED'
            });
        }

        return res.status(401).json({
            error: 'Unauthorized',
            code: 'QUAL_ADAPTER_UNAUTHORIZED',
            reason_code: 'QUAL_ADAPTER_UNAUTHORIZED'
        });
    }

    return next();
};

module.exports = {
    createInternalAuthMiddleware
};
