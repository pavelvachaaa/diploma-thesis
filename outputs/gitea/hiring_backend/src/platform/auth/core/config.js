const {
    DEFAULT_DUO_CLIENT_ID,
    DEFAULT_DUO_TOKEN_URI,
    DEFAULT_DUO_ISSUER,
    DEFAULT_UCP_API_URL
} = require('./constants');
const { deriveIssuerFromTokenUri } = require('./errors');

const getEnvFirst = (...keys) => {
    for (const key of keys) {
        const value = process.env[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return null;
};

const parseBooleanEnv = (name, fallback = false) => {
    const value = process.env[name];
    if (value === undefined) {
        return fallback;
    }
    return String(value).toLowerCase() === 'true';
};

const parseNumberEnv = (name, fallback) => {
    const raw = process.env[name];
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return fallback;
};

const parseCsvEnv = (name) => {
    return String(process.env[name] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

module.exports = {
    getTimeoutMs: () => parseNumberEnv('AUTH_HTTP_TIMEOUT_MS', 8000),
    getDuoConfig: () => {
        const tokenUri = getEnvFirst('AUTH_DUO_TOKEN_URI', 'DUO_OIDC_TOKEN_URI') || DEFAULT_DUO_TOKEN_URI;

        return {
            issuer: (
                getEnvFirst('AUTH_DUO_ISSUER', 'DUO_OIDC_ISSUER')
                || deriveIssuerFromTokenUri(tokenUri)
                || DEFAULT_DUO_ISSUER
            ).replace(/\/$/, ''),
            clientId: getEnvFirst('AUTH_DUO_CLIENT_ID', 'DUO_OIDC_CLIENT_ID', 'OAUTH_CLIENT_ID') || DEFAULT_DUO_CLIENT_ID,
            clientSecret: getEnvFirst('AUTH_DUO_CLIENT_SECRET', 'DUO_OIDC_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET'),
            tokenUri,
            allowedRedirectUris: parseCsvEnv('AUTH_DUO_ALLOWED_REDIRECT_URIS').length > 0
                ? parseCsvEnv('AUTH_DUO_ALLOWED_REDIRECT_URIS')
                : parseCsvEnv('DUO_OIDC_ALLOWED_REDIRECT_URIS')
        };
    },
    getUcpConfig: () => ({
        apiUrl: getEnvFirst('AUTH_UCP_API_URL') || DEFAULT_UCP_API_URL,
        moduleName: getEnvFirst('AUTH_UCP_MODULE') || 'mobile-api-pzm',
        functionName: getEnvFirst('AUTH_UCP_FUNCTION') || 'GetUserInfoForHRBackend',
        insecureTls: parseBooleanEnv('AUTH_UCP_INSECURE_TLS', false)
    })
};
