// Bootstrap OpenTelemetry tracing.
// MUST be loaded before any other application require so that auto-instrumentations
// can patch http/express/pg/amqplib/undici on first import.

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME
} = require('@opentelemetry/semantic-conventions/incubating');

const parseBool = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
};

let started = false;

const start = () => {
    if (started) return;
    if (!parseBool(process.env.OTEL_ENABLED, true)) {
        return;
    }

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://alloy:4318';
    const serviceName = process.env.OTEL_SERVICE_NAME || 'hiring-backend';
    const env = process.env.NODE_ENV || 'development';

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: serviceName,
            [ATTR_SERVICE_VERSION]: process.env.npm_package_version || 'unknown',
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: env
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${endpoint.replace(/\/$/, '')}/v1/traces`
        }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-net': { enabled: false },
                '@opentelemetry/instrumentation-dns': { enabled: false },
                '@opentelemetry/instrumentation-express': { enabled: true },
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: (req) => {
                        const url = req.url || '';
                        return url.startsWith('/metrics')
                            || url.startsWith('/hrbackend/health')
                            || url.startsWith('/hrbackend/ready');
                    }
                },
                '@opentelemetry/instrumentation-pg': { enabled: true },
                '@opentelemetry/instrumentation-amqplib': { enabled: true },
                '@opentelemetry/instrumentation-undici': { enabled: true }
            })
        ]
    });

    try {
        sdk.start();
        started = true;
    } catch (error) {
        // Don't crash the app if telemetry fails to initialize.
        // eslint-disable-next-line no-console
        console.error('[otel] failed to start SDK', error);
    }

    const shutdown = () => {
        sdk.shutdown().catch(() => {}).finally(() => process.exit(0));
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
};

module.exports = start;
