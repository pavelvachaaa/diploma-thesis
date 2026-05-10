const express = require('express');

const { createInternalAuthMiddleware } = require('./auth');
const { metricsHandler, httpMetricsMiddleware } = require('./metrics');

const createApp = ({ logger, config, irisClient }) => {
    const app = express();
    app.disable('x-powered-by');
    app.use(httpMetricsMiddleware);
    app.use(express.json({ limit: '128kb' }));

    app.get('/healthz', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            irisAvailable: typeof irisClient?.search === 'function'
                && irisClient.search.name !== ''
        });
    });

    app.get('/metrics', metricsHandler);

    app.use('/internal', createInternalAuthMiddleware({
        expectedToken: config.authToken,
        logger
    }));

    const getRequestId = (req) => req.headers['x-request-id'] || req.headers['request-id'] || null;

    app.post('/internal/users/search', async (req, res, next) => {
        const requestId = getRequestId(req);
        logger.info('User search endpoint hit', {
            endpoint: '/internal/users/search',
            method: req.method,
            request_id: requestId
        });

        try {
            const result = await irisClient.search({
                query: req.body?.query
            });

            logger.info('User search completed', {
                endpoint: '/internal/users/search',
                request_id: requestId,
                result_count: Array.isArray(result) ? result.length : null
            });

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    });

    app.use((error, req, res, _next) => {
        const status = error?.status || 500;
        const code = error?.code || 'USER_SEARCH_ADAPTER_INTERNAL_ERROR';
        const reasonCode = error?.reason_code || 'USER_SEARCH_ADAPTER_INTERNAL_ERROR';
        const message = status >= 500 ? 'User search provider invocation failed' : error.message;

        logger.error('User search adapter request failed', {
            endpoint: req?.path || null,
            method: req?.method || null,
            request_id: req ? getRequestId(req) : null,
            status,
            code,
            reason_code: reasonCode,
            details: error?.details || null,
            error: error?.message || String(error),
            cause: error?.cause?.message || (error?.cause ? String(error.cause) : null),
            cause_code: error?.cause?.code || null
        });

        return res.status(status).json({
            error: message,
            code,
            reason_code: reasonCode
        });
    });

    return app;
};

module.exports = {
    createApp
};
