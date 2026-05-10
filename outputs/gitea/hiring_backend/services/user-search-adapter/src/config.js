const DEFAULT_PORT = 8089;
const DEFAULT_IRIS_PORT = 1972;
const DEFAULT_IRIS_CLASS = 'UCP.JoinKZ.Users.Api';
const DEFAULT_METHOD_SEARCH = 'Search';
const DEFAULT_TIMEOUT_MS = 8000;

const getEnv = (name) => {
    const value = process.env[name];
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};

const parsePositiveInt = (rawValue, fallback) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.trunc(parsed);
};

const getFirstEnv = (...names) => {
    for (const name of names) {
        const value = getEnv(name);
        if (value) {
            return value;
        }
    }
    return null;
};

const readConfig = () => ({
    port: parsePositiveInt(getEnv('USER_SEARCH_ADAPTER_PORT'), DEFAULT_PORT),
    authToken: getEnv('USER_SEARCH_ADAPTER_AUTH_TOKEN'),
    iris: {
        host: getFirstEnv('USER_SEARCH_ADAPTER_IRIS_HOST', 'USER_SEARCH_IRIS_HOST'),
        port: parsePositiveInt(getFirstEnv('USER_SEARCH_ADAPTER_IRIS_PORT', 'USER_SEARCH_IRIS_PORT'), DEFAULT_IRIS_PORT),
        namespace: getFirstEnv('USER_SEARCH_ADAPTER_IRIS_NS', 'USER_SEARCH_IRIS_NS'),
        user: getFirstEnv('USER_SEARCH_ADAPTER_IRIS_USER', 'USER_SEARCH_IRIS_USER'),
        password: getFirstEnv('USER_SEARCH_ADAPTER_IRIS_PASSWORD', 'USER_SEARCH_IRIS_PASSWORD'),
        className: getFirstEnv('USER_SEARCH_ADAPTER_IRIS_CLASS', 'USER_SEARCH_IRIS_CLASS') || DEFAULT_IRIS_CLASS,
        methodSearch: getFirstEnv('USER_SEARCH_ADAPTER_IRIS_METHOD_SEARCH', 'USER_SEARCH_IRIS_METHOD_SEARCH') || DEFAULT_METHOD_SEARCH,
        timeoutMs: parsePositiveInt(
            getFirstEnv('USER_SEARCH_ADAPTER_IRIS_TIMEOUT_MS', 'USER_SEARCH_IRIS_TIMEOUT_MS'),
            DEFAULT_TIMEOUT_MS
        )
    }
});

const validateConfig = (config) => {
    const missing = [];
    if (!config.authToken) missing.push('USER_SEARCH_ADAPTER_AUTH_TOKEN');
    if (!config.iris.host) missing.push('USER_SEARCH_ADAPTER_IRIS_HOST');
    if (!config.iris.namespace) missing.push('USER_SEARCH_ADAPTER_IRIS_NS');
    if (!config.iris.user) missing.push('USER_SEARCH_ADAPTER_IRIS_USER');
    if (!config.iris.password) missing.push('USER_SEARCH_ADAPTER_IRIS_PASSWORD');

    if (missing.length > 0) {
        const error = new Error('User search adapter is misconfigured');
        error.code = 'USER_SEARCH_ADAPTER_CONFIG_MISSING';
        error.status = 503;
        error.reason_code = 'USER_SEARCH_ADAPTER_CONFIG_MISSING';
        error.details = { missing };
        throw error;
    }
};

module.exports = {
    readConfig,
    validateConfig
};
