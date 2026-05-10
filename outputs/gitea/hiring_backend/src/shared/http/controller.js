const ApplicationError = require('@core/shared/errors/ApplicationError');

/**
 * Maps ApplicationError domain codes to HTTP status codes.
 * This translation lives exclusively in the HTTP adapter layer —
 * the core never knows about HTTP status integers.
 */
const APPLICATION_ERROR_HTTP_STATUS = {
    // Domain / Application
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    UNPROCESSABLE: 422,
    CONFLICT: 409,
    FORBIDDEN: 403,
    INTERNAL_ERROR: 500,
    // Infrastructure / Outbound adapters
    UPSTREAM_MISCONFIGURED: 503,
    UPSTREAM_UNAVAILABLE: 503,
    UPSTREAM_ERROR: 502
};

const toHttpResult = (raw, fallbackStatusCode = 200) => {
    if (
        raw
        && typeof raw === 'object'
        && Object.prototype.hasOwnProperty.call(raw, 'statusCode')
        && Object.prototype.hasOwnProperty.call(raw, 'body')
    ) {
        return raw;
    }

    return {
        statusCode: fallbackStatusCode,
        body: raw
    };
};

const handle = (handler) => {
    if (typeof handler !== 'function') {
        throw new Error('handle(handler) requires a function');
    }

    return async (req, res, next) => {
        try {
            return await handler(req, res, next);
        } catch (error) {
            if (error instanceof ApplicationError) {
                error.status = APPLICATION_ERROR_HTTP_STATUS[error.code] ?? 500;
            }
            return next(error);
        }
    };
};

const sendResult = (res, raw, fallbackStatusCode = 200) => {
    const result = toHttpResult(raw, fallbackStatusCode);
    res.status(result.statusCode).json(result.body);
    return result;
};

const writeAndSend = async ({
    req,
    res,
    scope,
    handler,
    runWrite,
    fallbackStatusCode = 200
}) => {
    if (typeof runWrite !== 'function') {
        throw new Error('writeAndSend requires runWrite(req, scope, handler)');
    }

    const result = await runWrite({
        req,
        scope,
        handler,
        fallbackStatusCode
    });

    return sendResult(res, result, fallbackStatusCode);
};

module.exports = {
    handle,
    sendResult,
    writeAndSend
};
