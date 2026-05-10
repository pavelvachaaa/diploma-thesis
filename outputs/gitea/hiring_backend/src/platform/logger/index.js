const pino = require('pino');
const { getRequestContext } = require('@shared/requestContext');

let otelTraceApi = null;
try {
    // Lazy: telemetry may be disabled or unavailable in some processes (tests).
    otelTraceApi = require('@opentelemetry/api').trace;
} catch (_err) {
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
    } catch (_err) {
        return null;
    }
};

const safeSerializer = (obj) => {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular Reference]';
            }
            seen.add(value);
        }
        if (typeof value === 'function') {
            return '[Function]';
        }
        if (typeof value === 'undefined') {
            return '[Undefined]';
        }
        return value;
    }));
};

const SENSITIVE_KEYS = new Set([
    'password',
    'plainpassword',
    'token',
    'idtoken',
    'accesstoken',
    'refreshtoken',
    'auth_token',
    'authorization',
    'jwt',
    'jwtsecret',
    'secret',
    'clientsecret',
    'emailpassword',
    's3secretkey'
]);

const parseBooleanEnv = (name, fallback) => {
    const value = process.env[name];
    if (value === undefined) return fallback;
    return value === 'true';
};

const createPinoLogger = () => {
    const isProd = process.env.NODE_ENV === 'production';
    const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');
    const pretty = process.env.LOG_PRETTY ? process.env.LOG_PRETTY === 'true' : !isProd;

    const options = {
        level,
        timestamp: pino.stdTimeFunctions.isoTime,
        serializers: {
            ...pino.stdSerializers,
            '*': safeSerializer
        }
    };

    if (pretty) {
        const prettyTransport = require('pino-pretty')({
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true
        });
        return pino(options, prettyTransport);
    }

    return pino(options);
};

const createLoggerAdapter = () => {
    const baseLogger = createPinoLogger();
    const includeStack = parseBooleanEnv('LOG_INCLUDE_STACK', process.env.NODE_ENV !== 'production');

    const toSnakeContextBindings = () => {
        const context = getRequestContext();
        const traceBindings = getActiveTraceBindings();

        const hasContext = context && Object.keys(context).length > 0;
        if (!hasContext && !traceBindings) {
            return {};
        }

        const base = hasContext
            ? {
                request_id: context.requestId || null,
                user_id: context.userId || null,
                org_id: context.organizationId || null,
                org_ids: Array.isArray(context.organizationIds) ? context.organizationIds : [],
                method: context.method || null,
                path: context.path || null
            }
            : {};

        if (traceBindings) {
            base.trace_id = traceBindings.trace_id;
            base.span_id = traceBindings.span_id;
        }

        return base;
    };

    const sanitizeForLogging = (value, depth = 0, key = '') => {
        if (value === null || value === undefined) return value;
        if (depth > 6) return '[max-depth]';

        if (SENSITIVE_KEYS.has(String(key || '').toLowerCase())) {
            return '[REDACTED]';
        }

        if (value instanceof Error) {
            return {
                name: value.name,
                message: value.message,
                code: value.code || null,
                stack: includeStack && value.stack ? value.stack : undefined
            };
        }

        if (typeof value === 'string') {
            return value.length > 2000 ? `${value.slice(0, 2000)}...[truncated]` : value;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }

        if (Buffer.isBuffer(value)) {
            return `[buffer:${value.length}]`;
        }

        if (Array.isArray(value)) {
            const out = value.slice(0, 50).map((item) => sanitizeForLogging(item, depth + 1));
            if (value.length > 50) {
                out.push('[truncated]');
            }
            return out;
        }

        if (typeof value === 'object') {
            const out = {};
            const entries = Object.entries(value).slice(0, 100);

            for (const [entryKey, entryValue] of entries) {
                out[entryKey] = sanitizeForLogging(entryValue, depth + 1, entryKey);
            }

            if (Object.keys(value).length > 100) {
                out.__truncated__ = true;
            }

            return out;
        }

        return String(value);
    };

    const normalizePayload = (payload) => {
        if (payload instanceof Error) {
            return {
                error: {
                    name: payload.name,
                    message: payload.message,
                    code: payload.code,
                    stack: includeStack ? payload.stack : undefined
                }
            };
        }

        if (payload && typeof payload === 'object') {
            return safeSerializer(sanitizeForLogging(payload));
        }

        return { value: sanitizeForLogging(payload) };
    };

    const buildLogEnvelope = (message, payload) => {
        const context = toSnakeContextBindings();

        if (message instanceof Error && typeof payload === 'undefined') {
            return {
                msg: message.message || message.name || 'error',
                data: {
                    ...context,
                    ...normalizePayload(message)
                }
            };
        }

        if (typeof message === 'string') {
            if (typeof payload === 'undefined') {
                return {
                    msg: message,
                    data: { ...context }
                };
            }

            return {
                msg: message,
                data: {
                    ...context,
                    ...normalizePayload(payload)
                }
            };
        }

        if (message && typeof message === 'object') {
            if (typeof payload === 'string') {
                return {
                    msg: payload,
                    data: {
                        ...context,
                        ...normalizePayload(message)
                    }
                };
            }

            if (typeof payload === 'undefined') {
                return {
                    msg: message.message && typeof message.message === 'string' ? message.message : undefined,
                    data: {
                        ...context,
                        ...normalizePayload(message)
                    }
                };
            }

            return {
                msg: undefined,
                data: {
                    ...context,
                    ...normalizePayload({
                        message,
                        payload
                    })
                }
            };
        }

        if (typeof payload === 'undefined') {
            return {
                msg: String(message),
                data: { ...context }
            };
        }

        return {
            msg: String(message),
            data: {
                ...context,
                ...normalizePayload(payload)
            }
        };
    };

    const createLoggerFacade = (targetLogger) => {
        const write = (level, message, payload) => {
            const envelope = buildLogEnvelope(message, payload);
            if (envelope.msg) {
                targetLogger[level](envelope.data, envelope.msg);
                return;
            }
            targetLogger[level](envelope.data);
        };

        return {
            info: (message, obj) => write('info', message, obj),
            error: (message, obj) => write('error', message, obj),
            warn: (message, obj) => write('warn', message, obj),
            debug: (message, obj) => write('debug', message, obj),
            fatal: (message, obj) => write('fatal', message, obj),
            trace: (message, obj) => write('trace', message, obj),
            child: (bindings) => createLoggerFacade(targetLogger.child(sanitizeForLogging(bindings))),
            level: targetLogger.level,
            levels: targetLogger.levels,
            silent: (...args) => targetLogger.silent(...args)
        };
    };

    return createLoggerFacade(baseLogger);
};

const defaultLogger = createLoggerAdapter();
const loggerFactory = () => createLoggerAdapter();

Object.assign(loggerFactory, defaultLogger);

module.exports = loggerFactory;
