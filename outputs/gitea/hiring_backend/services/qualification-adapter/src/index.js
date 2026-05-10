// Bootstrap OTel before requiring express-using modules.
require('./telemetry')();

const { readConfig, validateConfig } = require('./config');
const { createIrisClient } = require('./irisClient');
const { createApp } = require('./app');
const { createProviderError } = require('./errors');

const createLogger = () => ({
    info: (message, data = {}) => console.log(JSON.stringify({ level: 'info', msg: message, ...data })),
    warn: (message, data = {}) => console.warn(JSON.stringify({ level: 'warn', msg: message, ...data })),
    error: (message, data = {}) => console.error(JSON.stringify({ level: 'error', msg: message, ...data }))
});

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
        logger.error('IRIS native module is unavailable, qualification adapter is running in degraded mode', {
            reason_code: 'QUAL_IRIS_NATIVE_MODULE_MISSING',
            error: error.message
        });

        irisClient = {
            lookupByWorkerNumber: async () => {
                throw createProviderError('Qualification provider is unavailable', {
                    status: 503,
                    code: 'QUALIFICATION_PROVIDER_UNAVAILABLE',
                    reasonCode: 'QUAL_IRIS_NATIVE_MODULE_MISSING'
                });
            },
            lookupByBirthNumber: async () => {
                throw createProviderError('Qualification provider is unavailable', {
                    status: 503,
                    code: 'QUALIFICATION_PROVIDER_UNAVAILABLE',
                    reasonCode: 'QUAL_IRIS_NATIVE_MODULE_MISSING'
                });
            },
            close: () => {}
        };
    }

    const app = createApp({ logger, config, irisClient });

    const server = app.listen(config.port, () => {
        logger.info('Qualification adapter started', {
            port: config.port
        });
    });

    const shutdown = () => {
        logger.info('Qualification adapter shutting down');
        irisClient.close();
        server.close(() => {
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

bootstrap();
