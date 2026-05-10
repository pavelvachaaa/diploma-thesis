// Bootstrap OTel before requiring express-using modules.
require('./telemetry')();

const { readConfig, validateConfig } = require('./config');
const { createIrisClient } = require('./irisClient');
const { createApp } = require('./app');
const { createProviderError } = require('./errors');

let otelTraceApi = null;
try {
    otelTraceApi = require('@opentelemetry/api').trace;
} catch (_) {
    otelTraceApi = null;
}

const getActiveTraceBindings = () => {
    if (!otelTraceApi) return null;
    try {
        const span = otelTraceApi.getActiveSpan();
        if (!span) return null;
        const ctx = span.spanContext();
        if (!ctx || !ctx.traceId) return null;
        return { trace_id: ctx.traceId, span_id: ctx.spanId };
    } catch (_) {
        return null;
    }
};

const createLogger = () => {
    const write = (stream, level, message, data = {}) => {
        const trace = getActiveTraceBindings();
        stream(JSON.stringify({ level, msg: message, ...(trace || {}), ...data }));
    };
    return {
        info: (message, data) => write(console.log, 'info', message, data),
        warn: (message, data) => write(console.warn, 'warn', message, data),
        error: (message, data) => write(console.error, 'error', message, data)
    };
};

const bootstrap = () => {
    const logger = createLogger();
    const config = readConfig();
    validateConfig(config);

    let irisClient;
    try {
        const irisNativeModule = require('@intersystems/intersystems-iris-native');
        irisClient = createIrisClient({
            logger,
            config,
            irisNativeModule
        });
    } catch (error) {
        logger.error('IRIS native module is unavailable, user search adapter is running in degraded mode', {
            reason_code: 'USER_SEARCH_IRIS_NATIVE_MODULE_MISSING',
            error: error.message
        });

        irisClient = {
            search: async () => {
                throw createProviderError('User search provider is unavailable', {
                    status: 503,
                    code: 'USER_SEARCH_PROVIDER_UNAVAILABLE',
                    reasonCode: 'USER_SEARCH_IRIS_NATIVE_MODULE_MISSING'
                });
            },
            close: () => {}
        };
    }

    const app = createApp({ logger, config, irisClient });

    const server = app.listen(config.port, () => {
        logger.info('User search adapter started', {
            port: config.port
        });
    });

    const shutdown = () => {
        logger.info('User search adapter shutting down');
        irisClient.close();
        server.close(() => {
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

bootstrap();
