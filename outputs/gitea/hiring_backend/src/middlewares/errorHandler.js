const container = require('@/container');
const logger = require('@platform/logger');
const audit = container.resolve('audit');

const parseBooleanEnv = (name, fallback) => {
    const value = process.env[name];
    if (value === undefined) return fallback;
    return value === 'true';
};

const includeStack = parseBooleanEnv('LOG_INCLUDE_STACK', process.env.NODE_ENV !== 'production');

module.exports = (err, req, res, _next) => {
    res.locals.auditError = err.message;
    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal Server Error';
    const errorCode = err.code
        || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');

    void audit.writeAuditEvent({
        category: 'error',
        action: `http.${(req.method || 'unknown').toLowerCase()}.failed`,
        status: 'failure',
        method: req.method,
        path: req.originalUrl,
        statusCode,
        errorMessage,
        metadata: {
            routePath: req.route?.path || null,
            baseUrl: req.baseUrl || null,
            errorName: err.name || 'Error',
            errorCode,
            stack: includeStack && err.stack ? String(err.stack).slice(0, 2000) : null
        }
    });

    logger.error('Unhandled request error', {
        method: req.method,
        url: req.originalUrl,
        status_code: statusCode,
        error_name: err.name || 'Error',
        error_message: errorMessage,
        error_code: errorCode,
        stack: includeStack ? err.stack : undefined
    });

    res.status(statusCode).json({
        error: errorMessage,
        code: errorCode,
        meta: {
            request_id: req.requestId || null
        }
    });
};
