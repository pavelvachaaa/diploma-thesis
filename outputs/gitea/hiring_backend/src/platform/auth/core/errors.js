const { URL } = require('node:url');
const { DEFAULT_DUO_ISSUER } = require('./constants');

const createAuthProviderError = (
    message,
    {
        status = 500,
        code = 'AUTH_PROVIDER_ERROR',
        error = null,
        errorDescription = null,
        details = null
    } = {}
) => {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    err.error = error || null;
    err.error_description = errorDescription || null;
    err.details = details || null;
    return err;
};

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch (_error) {
        return null;
    }
};

const deriveIssuerFromTokenUri = (tokenUri) => {
    try {
        const parsed = new URL(tokenUri);
        parsed.pathname = parsed.pathname.replace(/\/token\/?$/, '');
        return parsed.toString().replace(/\/$/, '');
    } catch (_error) {
        return DEFAULT_DUO_ISSUER;
    }
};

module.exports = {
    createAuthProviderError,
    parseJsonSafe,
    deriveIssuerFromTokenUri
};
