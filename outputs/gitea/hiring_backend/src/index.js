// Setup module aliases - MUST be first
require('module-alias/register');

// Bootstrap OpenTelemetry before any instrumented module is required.
require('@platform/telemetry/otel')();

const container = require('@/container');
const registry = require('@/container.registry');
const logger = require('@platform/logger');
const { validatePortContracts } = require('@shared/contracts/runtime');
const { createApp } = require('@/app');
const { startServer } = require('@/startup/server');
const db = container.resolve('db');
const portTokens = Object.keys(registry.infrastructure || {})
    .filter((token) => token.endsWith('Port'))
    .sort();

validatePortContracts(container, portTokens);

const app = createApp({ container });

void startServer({
    app,
    db,
    container,
    logger
}).catch((error) => {
    logger.fatal('Server startup failed', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

module.exports = { app };
