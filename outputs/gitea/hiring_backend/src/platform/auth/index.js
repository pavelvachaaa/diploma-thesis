const config = require('./core/config');
const createHttpClient = require('./core/httpClient');
const createDuoAuth = require('./core/duo');
const createUcpAuth = require('./core/ucp');

module.exports = ({ logger }) => {
    const httpClient = createHttpClient({
        getTimeoutMs: config.getTimeoutMs
    });

    const duoAuth = createDuoAuth({
        logger,
        getDuoConfig: config.getDuoConfig,
        fetchWithTimeout: httpClient.fetchWithTimeout
    });

    const ucpAuth = createUcpAuth({
        getUcpConfig: config.getUcpConfig,
        fetchWithTimeout: httpClient.fetchWithTimeout,
        getUcpInsecureDispatcher: httpClient.getUcpInsecureDispatcher
    });

    return {
        exchangeAuthorizationCode: duoAuth.exchangeAuthorizationCode,
        verifyCiscoToken: duoAuth.verifyCiscoToken,
        fetchUcpUserInfo: ucpAuth.fetchUcpUserInfo
    };
};
