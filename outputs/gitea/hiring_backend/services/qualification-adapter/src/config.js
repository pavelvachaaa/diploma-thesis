const DEFAULT_PORT = 8088;
const DEFAULT_IRIS_PORT = 1972;
const DEFAULT_IRIS_CLASS = 'UCP.UZIS.ApiTest';
const DEFAULT_METHOD_BY_NRZP = 'CtiPracovnik';
const DEFAULT_METHOD_BY_RC = 'CtiPracovnikPodleRodnehoCisla';
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
    port: parsePositiveInt(getEnv('QUAL_ADAPTER_PORT'), DEFAULT_PORT),
    authToken: getEnv('QUAL_ADAPTER_AUTH_TOKEN'),
    iris: {
        host: getFirstEnv('QUAL_ADAPTER_IRIS_HOST', 'QUAL_IRIS_HOST'),
        port: parsePositiveInt(getFirstEnv('QUAL_ADAPTER_IRIS_PORT', 'QUAL_IRIS_PORT'), DEFAULT_IRIS_PORT),
        namespace: getFirstEnv('QUAL_ADAPTER_IRIS_NS', 'QUAL_IRIS_NS'),
        user: getFirstEnv('QUAL_ADAPTER_IRIS_USER', 'QUAL_IRIS_USER'),
        password: getFirstEnv('QUAL_ADAPTER_IRIS_PASSWORD', 'QUAL_IRIS_PASSWORD'),
        className: getFirstEnv('QUAL_ADAPTER_IRIS_CLASS', 'QUAL_IRIS_CLASS') || DEFAULT_IRIS_CLASS,
        methodByNrzp: getFirstEnv('QUAL_ADAPTER_IRIS_METHOD_BY_NRZP', 'QUAL_IRIS_METHOD_BY_NRZP') || DEFAULT_METHOD_BY_NRZP,
        methodByBirthNumber: getFirstEnv('QUAL_ADAPTER_IRIS_METHOD_BY_RC', 'QUAL_IRIS_METHOD_BY_RC') || DEFAULT_METHOD_BY_RC,
        timeoutMs: parsePositiveInt(getFirstEnv('QUAL_ADAPTER_IRIS_TIMEOUT_MS', 'QUAL_IRIS_TIMEOUT_MS'), DEFAULT_TIMEOUT_MS)
    }
});

const validateConfig = (config) => {
    const missing = [];
    if (!config.authToken) missing.push('QUAL_ADAPTER_AUTH_TOKEN');
    if (!config.iris.host) missing.push('QUAL_ADAPTER_IRIS_HOST');
    if (!config.iris.namespace) missing.push('QUAL_ADAPTER_IRIS_NS');
    if (!config.iris.user) missing.push('QUAL_ADAPTER_IRIS_USER');
    if (!config.iris.password) missing.push('QUAL_ADAPTER_IRIS_PASSWORD');

    if (missing.length > 0) {
        const error = new Error('Qualification adapter is misconfigured');
        error.code = 'QUAL_ADAPTER_CONFIG_MISSING';
        error.status = 503;
        error.reason_code = 'QUAL_ADAPTER_CONFIG_MISSING';
        error.details = { missing };
        throw error;
    }
};

module.exports = {
    readConfig,
    validateConfig
};
