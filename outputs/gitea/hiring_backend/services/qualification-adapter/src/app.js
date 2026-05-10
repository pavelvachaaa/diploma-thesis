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
            irisAvailable: typeof irisClient?.lookupByWorkerNumber === 'function'
                && irisClient.lookupByWorkerNumber.name !== ''
        });
    });

    app.get('/metrics', metricsHandler);

    app.use('/internal', createInternalAuthMiddleware({
        expectedToken: config.authToken,
        logger
    }));

    const getRequestId = (req) => req.headers['x-request-id'] || req.headers['request-id'] || null;

    app.post('/internal/qualification/lookup/by-worker-number', async (req, res, next) => {
        const requestId = getRequestId(req);
        logger.info('Qualification lookup endpoint hit', {
            endpoint: '/internal/qualification/lookup/by-worker-number',
            method: req.method,
            request_id: requestId
        });

        try {
            const result = await irisClient.lookupByWorkerNumber({
                pracovnikNrzpCislo: req.body?.pracovnikNrzpCislo
            });

            logger.info('Qualification lookup completed', {
                endpoint: '/internal/qualification/lookup/by-worker-number',
                request_id: requestId,
                upstream_status: result?.status ?? null,
                upstream_success: result?.data?.Success ?? null
            });
            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    });

    app.post('/internal/qualification/lookup/by-birth-number', async (req, res, next) => {
        const requestId = getRequestId(req);
        logger.info('Qualification lookup endpoint hit', {
            endpoint: '/internal/qualification/lookup/by-birth-number',
            method: req.method,
            request_id: requestId
        });

        try {
            const result = await irisClient.lookupByBirthNumber({
                rodneCislo: req.body?.rodneCislo
            });

            logger.info('Qualification lookup completed', {
                endpoint: '/internal/qualification/lookup/by-birth-number',
                request_id: requestId,
                upstream_status: result?.status ?? null,
                upstream_success: result?.data?.Success ?? null
            });
            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    });

    app.use((error, req, res, _next) => {
        const status = error?.status || 500;
        const code = error?.code || 'QUAL_ADAPTER_INTERNAL_ERROR';
        const reasonCode = error?.reason_code || 'QUAL_ADAPTER_INTERNAL_ERROR';
        const message = status >= 500 ? 'Qualification provider invocation failed' : error.message;

        logger.error('Qualification adapter request failed', {
            endpoint: req?.path || null,
            method: req?.method || null,
            request_id: req ? getRequestId(req) : null,
            status,
            code,
            reason_code: reasonCode,
            details: error?.details || null,
            error: error?.message || String(error)
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
