const promClient = require('prom-client');

const register = new promClient.Registry();
register.setDefaultLabels({ service: process.env.OTEL_SERVICE_NAME || 'qualification-adapter' });
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds, by method/route/status',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [register]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests, by method/route/status',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const buildRouteLabel = (req) => {
    const baseUrl = req.baseUrl || '';
    const routePath = req.route?.path;
    if (routePath) {
        return `${baseUrl}${routePath}`.replace(/\/+/g, '/') || '/';
    }
    return 'unmatched';
};

const httpMetricsMiddleware = (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        const labels = {
            method: String(req.method || 'UNKNOWN').toUpperCase(),
            route: buildRouteLabel(req),
            status_code: String(res.statusCode || 0)
        };
        httpRequestDuration.observe(labels, durationSeconds);
        httpRequestsTotal.inc(labels);
    });
    next();
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
    httpMetricsMiddleware
};
