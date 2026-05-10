const executeIdempotent = require('./idempotency');

const toHttpResult = (raw, fallbackStatusCode) => {
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

module.exports = ({ commandIdempotencyService, logger = null }) => {
    return async ({ req, scope, handler, fallbackStatusCode = 200 }) => {
        if (!commandIdempotencyService) {
            const raw = await handler();
            return toHttpResult(raw, fallbackStatusCode);
        }

        return executeIdempotent({
            commandIdempotencyService,
            req,
            scope,
            logger,
            handler: async () => {
                const raw = await handler();
                return toHttpResult(raw, fallbackStatusCode);
            }
        });
    };
};
