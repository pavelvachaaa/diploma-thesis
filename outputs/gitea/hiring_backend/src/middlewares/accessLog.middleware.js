const logger = require('@platform/logger');
const { getRequestContext } = require('@shared/requestContext');
const { observeHttpRequest } = require('@platform/metrics');

const buildRouteLabel = (req) => {
    const baseUrl = req.baseUrl || '';
    const routePath = req.route?.path;
    if (routePath) {
        return `${baseUrl}${routePath}`.replace(/\/+/g, '/') || '/';
    }
    if (req.originalUrl) {
        return 'unmatched';
    }
    return 'unknown';
};

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getMode = () => (process.env.LOG_HTTP_ACCESS_MODE || 'errors_and_slow').toLowerCase();

const shouldLogAccess = ({ statusCode, durationMs }) => {
    const mode = getMode();

    if (mode === 'none') {
        return false;
    }

    if (mode === 'all') {
        return true;
    }

    const slowThresholdMs = parseNumber(process.env.LOG_HTTP_SLOW_MS, 2000);
    return statusCode >= 400 || durationMs >= slowThresholdMs;
};

const accessLogMiddleware = (req, res, next) => {
    res.on('finish', () => {
        const context = getRequestContext();
        const requestStartAt = context.requestStartAt || Date.now();
        const durationMs = Math.max(0, Date.now() - requestStartAt);
        const statusCode = res.statusCode || 0;

        // Always emit HTTP metrics, regardless of access-log mode.
        observeHttpRequest({
            method: req.method,
            route: buildRouteLabel(req),
            statusCode,
            durationMs
        });

        if (!shouldLogAccess({ statusCode, durationMs })) {
            return;
        }

        logger.info('HTTP request completed', {
            request_id: context.requestId || null,
            user_id: context.userId || null,
            org_id: context.organizationId || null,
            method: req.method,
            path: req.originalUrl || req.url || null,
            status_code: statusCode,
            duration_ms: durationMs,
            ip: req.ip || null,
            user_agent: req.get('user-agent') || null
        });
    });

    next();
};

module.exports = {
    accessLogMiddleware,
    shouldLogAccess
};
