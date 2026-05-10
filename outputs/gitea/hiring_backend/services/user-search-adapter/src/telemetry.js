// OTel bootstrap for user-search-adapter — must be required before express.

const parseBool = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
};

const start = () => {
    if (!parseBool(process.env.OTEL_ENABLED, true)) return;

    let NodeSDK;
    let OTLPTraceExporter;
    let getNodeAutoInstrumentations;
    let resourceFromAttributes;
    let semconv;
    try {
        NodeSDK = require('@opentelemetry/sdk-node').NodeSDK;
        OTLPTraceExporter = require('@opentelemetry/exporter-trace-otlp-http').OTLPTraceExporter;
        getNodeAutoInstrumentations = require('@opentelemetry/auto-instrumentations-node').getNodeAutoInstrumentations;
        resourceFromAttributes = require('@opentelemetry/resources').resourceFromAttributes;
        semconv = require('@opentelemetry/semantic-conventions/incubating');
    } catch (_err) {
        return;
    }

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://alloy:4318';
    const serviceName = process.env.OTEL_SERVICE_NAME || 'user-search-adapter';

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [semconv.ATTR_SERVICE_NAME]: serviceName,
            [semconv.ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development'
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${endpoint.replace(/\/$/, '')}/v1/traces`
        }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-net': { enabled: false },
                '@opentelemetry/instrumentation-dns': { enabled: false },
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: (req) => {
                        const url = req.url || '';
                        return url.startsWith('/metrics') || url.startsWith('/healthz');
                    }
                }
            })
        ]
    });

    try {
        sdk.start();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[otel] user-search-adapter failed to start SDK', error);
    }

    const shutdown = () => {
        sdk.shutdown().catch(() => {}).finally(() => process.exit(0));
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
};

module.exports = start;
