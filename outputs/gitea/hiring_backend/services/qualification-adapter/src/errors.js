const createProviderError = (
    message,
    {
        status = 502,
        code = 'QUALIFICATION_PROVIDER_ERROR',
        reasonCode = 'QUALIFICATION_PROVIDER_ERROR',
        details = null,
        cause = null
    } = {}
) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.reason_code = reasonCode;
    error.details = details;
    if (cause) {
        error.cause = cause;
    }
    return error;
};

module.exports = {
    createProviderError
};
