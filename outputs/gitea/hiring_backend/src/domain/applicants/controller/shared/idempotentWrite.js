const executeIdempotent = require('@shared/http/idempotency');

module.exports = ({ commandIdempotencyService, logger }) => {
    const runIdempotentWrite = async ({ req, scope, handler }) => {
        return executeIdempotent({
            commandIdempotencyService,
            req,
            scope,
            logger,
            handler
        });
    };

    return {
        runIdempotentWrite
    };
};
