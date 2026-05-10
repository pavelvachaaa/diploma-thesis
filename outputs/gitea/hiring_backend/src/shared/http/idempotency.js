const { resolveScope, resolveIdempotencyKey } = require('./idempotencyPolicy');

module.exports = ({
    commandIdempotencyService,
    req,
    scope,
    handler,
    logger = null
}) => {
    const effectiveScope = resolveScope({ req, explicitScope: scope });
    const idempotencyKey = resolveIdempotencyKey(req);

    if (logger?.debug) {
        logger.debug('Executing idempotent HTTP write handler', {
            scope: effectiveScope,
            has_idempotency_key: Boolean(idempotencyKey),
            method: req?.method || null,
            path: req?.path || req?.originalUrl || null
        });
    }

    return commandIdempotencyService.execute({
        scope: effectiveScope,
        idempotencyKey,
        request: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            body: req.body,
            actorId: req.user?.id || null
        }
    }, handler);
};
