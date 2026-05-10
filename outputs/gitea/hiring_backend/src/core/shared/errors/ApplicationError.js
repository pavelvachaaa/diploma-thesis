const ErrorCode = Object.freeze({
    // ── Domain / Application errors ──────────────────────────────────────────
    VALIDATION_ERROR: 'VALIDATION_ERROR',     // required field missing or format invalid
    NOT_FOUND: 'NOT_FOUND',                   // resource does not exist
    UNAUTHORIZED: 'UNAUTHORIZED',             // authentication failed or session is invalid
    UNPROCESSABLE: 'UNPROCESSABLE',           // valid format but cannot be processed
    CONFLICT: 'CONFLICT',                     // duplicate or state conflict
    FORBIDDEN: 'FORBIDDEN',                   // actor lacks permission

    // ── Infrastructure / Outbound adapter errors ─────────────────────────────
    // These are thrown by outbound adapters when an upstream service fails.
    // The HTTP adapter (handle()) maps them to HTTP status codes; the core
    // never knows about 502/503.
    UPSTREAM_MISCONFIGURED: 'UPSTREAM_MISCONFIGURED', // adapter config is missing → 503
    UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',     // timeout, auth rejected, service down → 503
    UPSTREAM_ERROR: 'UPSTREAM_ERROR',                 // bad gateway, invalid response shape → 502

    // ── Catch-all ────────────────────────────────────────────────────────────
    INTERNAL_ERROR: 'INTERNAL_ERROR'          // unexpected failure
});

class ApplicationError extends Error {
    constructor(message, { code = ErrorCode.INTERNAL_ERROR, details = null } = {}) {
        super(message);
        this.name = 'ApplicationError';
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApplicationError;
module.exports.ErrorCode = ErrorCode;
