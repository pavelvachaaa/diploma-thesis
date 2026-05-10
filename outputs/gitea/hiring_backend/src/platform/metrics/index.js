const promClient = require('prom-client');
const { trace } = require('@opentelemetry/api');

const parseBool = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
};

// prom-client supports exemplars only when the registry exports OpenMetrics.
const useOpenMetrics = parseBool(process.env.METRICS_OPENMETRICS, false);
const registryContentType = useOpenMetrics
    ? promClient.Registry.OPENMETRICS_CONTENT_TYPE
    : promClient.Registry.PROMETHEUS_CONTENT_TYPE;
const register = new promClient.Registry(registryContentType);
const exemplarsEnabled = register.contentType === promClient.Registry.OPENMETRICS_CONTENT_TYPE;
register.setDefaultLabels({ service: process.env.OTEL_SERVICE_NAME || 'hiring-backend' });
promClient.collectDefaultMetrics({ register });

// HTTP metrics — populated by accessLog middleware
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds, by method/route/status',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    enableExemplars: exemplarsEnabled,
    registers: [register]
});

const currentTraceExemplarLabels = () => {
    if (!exemplarsEnabled) return undefined;
    const span = trace.getActiveSpan();
    if (!span) return undefined;
    const ctx = span.spanContext();
    if (!ctx?.traceId) return undefined;
    return { trace_id: ctx.traceId, span_id: ctx.spanId };
};

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests, by method/route/status',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// Outbox metrics — populated by background refresh
const outboxOldestPendingAgeSeconds = new promClient.Gauge({
    name: 'outbox_oldest_pending_age_seconds',
    help: 'Age in seconds of the oldest pending side-effect outbox row',
    registers: [register]
});

const outboxOldestProcessingAgeSeconds = new promClient.Gauge({
    name: 'outbox_oldest_processing_age_seconds',
    help: 'Age in seconds of the oldest processing side-effect outbox row',
    registers: [register]
});

const outboxRowsByStatus = new promClient.Gauge({
    name: 'outbox_rows_by_status',
    help: 'Number of side-effect outbox rows by status (and event_type when available)',
    labelNames: ['status', 'event_type'],
    registers: [register]
});

// DB pool — pulled directly from pg.Pool fields on each scrape
const dbPoolTotal = new promClient.Gauge({
    name: 'db_pool_total',
    help: 'Total number of pg pool clients (idle + active + waiting)',
    registers: [register]
});

const dbPoolIdle = new promClient.Gauge({
    name: 'db_pool_idle',
    help: 'Idle pg pool clients',
    registers: [register]
});

const dbPoolWaiting = new promClient.Gauge({
    name: 'db_pool_waiting',
    help: 'Requests waiting for a pg pool client',
    registers: [register]
});

// Runtime readiness gauges
const componentReady = new promClient.Gauge({
    name: 'app_component_ready',
    help: 'Whether a runtime component is ready (1) or not (0)',
    labelNames: ['component'],
    registers: [register]
});

let pollHandle = null;

const refreshOutboxMetrics = async ({ outboxService, logger }) => {
    if (!outboxService || typeof outboxService.inspectSummary !== 'function') return;
    try {
        const snapshot = await outboxService.inspectSummary({});

        const operability = snapshot.operability || {};
        if (operability.oldestPendingAgeSec === null || operability.oldestPendingAgeSec === undefined) {
            outboxOldestPendingAgeSeconds.set(0);
        } else {
            outboxOldestPendingAgeSeconds.set(Number(operability.oldestPendingAgeSec) || 0);
        }
        if (operability.oldestProcessingAgeSec === null || operability.oldestProcessingAgeSec === undefined) {
            outboxOldestProcessingAgeSeconds.set(0);
        } else {
            outboxOldestProcessingAgeSeconds.set(Number(operability.oldestProcessingAgeSec) || 0);
        }

        outboxRowsByStatus.reset();
        for (const row of snapshot.summary || []) {
            outboxRowsByStatus
                .labels(row.status || 'unknown', row.event_type || 'all')
                .set(Number(row.count) || 0);
        }
    } catch (error) {
        if (logger) {
            logger.warn('Failed to refresh outbox metrics', { error: error.message });
        }
    }
};

const refreshRuntimeStatusMetrics = (getRuntimeStatus) => {
    if (typeof getRuntimeStatus !== 'function') return;
    try {
        const status = getRuntimeStatus();
        componentReady.labels('db').set(status.db?.ready ? 1 : 0);
        componentReady.labels('outbox_worker').set(status.outboxWorker?.ready ? 1 : 0);
        componentReady.labels('rabbit_consumers').set(status.rabbitConsumers?.ready ? 1 : 0);
        componentReady.labels('idempotency_cleanup').set(status.idempotencyCleanup?.ready ? 1 : 0);
    } catch (_err) {
        // best-effort
    }
};

const startBackgroundRefresh = ({ outboxService, getRuntimeStatus, dbPool, logger }) => {
    const intervalMs = Number(process.env.METRICS_REFRESH_MS) || 15000;

    const tick = () => {
        if (dbPool && typeof dbPool.totalCount === 'number') {
            dbPoolTotal.set(dbPool.totalCount);
            dbPoolIdle.set(dbPool.idleCount || 0);
            dbPoolWaiting.set(dbPool.waitingCount || 0);
        }
        refreshRuntimeStatusMetrics(getRuntimeStatus);
        // Outbox snapshot is async; fire and forget.
        void refreshOutboxMetrics({ outboxService, logger });
    };

    tick();
    pollHandle = setInterval(tick, intervalMs);
    if (typeof pollHandle.unref === 'function') pollHandle.unref();
};

const stopBackgroundRefresh = () => {
    if (pollHandle) {
        clearInterval(pollHandle);
        pollHandle = null;
    }
};

const observeHttpRequest = ({ method, route, statusCode, durationMs }) => {
    const seconds = Math.max(0, durationMs) / 1000;
    const labels = {
        method: String(method || 'UNKNOWN').toUpperCase(),
        route: route || 'unmatched',
        status_code: String(statusCode || 0)
    };
    if (exemplarsEnabled) {
        const exemplarLabels = currentTraceExemplarLabels();
        httpRequestDuration.observe({
            labels,
            value: seconds,
            exemplarLabels: exemplarLabels || {}
        });
    } else {
        httpRequestDuration.observe(labels, seconds);
    }
    httpRequestsTotal.inc(labels);
};

const metricsHandler = async (_req, res, next) => {
    try {
        res.setHeader('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    metricsHandler,
    observeHttpRequest,
    startBackgroundRefresh,
    stopBackgroundRefresh
};
