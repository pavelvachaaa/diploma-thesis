const { createProviderError } = require('./errors');

const isConnectionLikeError = (error) => {
    const text = String(error?.message || '').toLowerCase();
    return text.includes('connection')
        || text.includes('closed')
        || text.includes('socket')
        || text.includes('network')
        || text.includes('timeout');
};

const parseSearchResult = (jsonPayload, { methodName }) => {
    if (!jsonPayload || typeof jsonPayload !== 'string') {
        throw createProviderError('User search provider returned empty response', {
            status: 502,
            code: 'USER_SEARCH_PROVIDER_INVALID_RESPONSE',
            reasonCode: 'USER_SEARCH_IRIS_EMPTY_RESPONSE',
            details: { methodName }
        });
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonPayload);
    } catch (error) {
        throw createProviderError('User search provider returned invalid JSON', {
            status: 502,
            code: 'USER_SEARCH_PROVIDER_INVALID_JSON',
            reasonCode: 'USER_SEARCH_IRIS_INVALID_JSON',
            details: { methodName },
            cause: error
        });
    }

    if (!Array.isArray(parsed)) {
        throw createProviderError('User search provider returned invalid payload shape', {
            status: 502,
            code: 'USER_SEARCH_PROVIDER_INVALID_RESPONSE',
            reasonCode: 'USER_SEARCH_IRIS_INVALID_PAYLOAD',
            details: { methodName }
        });
    }

    return parsed;
};

const createIrisClient = ({ logger, config, irisNativeModule }) => {
    let cachedConnection = null;
    let cachedIris = null;

    const closeConnection = () => {
        if (!cachedConnection) {
            cachedConnection = null;
            cachedIris = null;
            return;
        }

        try {
            cachedConnection.close();
        } catch (error) {
            logger.warn('Failed to close IRIS user search connection', {
                reason_code: 'USER_SEARCH_IRIS_CLOSE_FAILED',
                error: error.message
            });
        } finally {
            cachedConnection = null;
            cachedIris = null;
        }
    };

    const openConnection = () => {
        try {
            cachedConnection = irisNativeModule.createConnection({
                host: config.iris.host,
                port: config.iris.port,
                ns: config.iris.namespace,
                user: config.iris.user,
                pwd: config.iris.password,
                timeout: config.iris.timeoutMs
            });
            cachedIris = cachedConnection.createIris();
        } catch (error) {
            closeConnection();
            throw createProviderError('Failed to connect to user search provider', {
                status: 502,
                code: 'USER_SEARCH_PROVIDER_CONNECT_FAILED',
                reasonCode: 'USER_SEARCH_IRIS_CONNECT_FAILED',
                cause: error
            });
        }

        return cachedIris;
    };

    const getIrisClient = () => {
        if (cachedConnection && cachedIris) {
            try {
                if (typeof cachedConnection.isClosed !== 'function' || !cachedConnection.isClosed()) {
                    return cachedIris;
                }
            } catch (error) {
                logger.warn('Failed to read IRIS connection state, recreating user search connection', {
                    reason_code: 'USER_SEARCH_IRIS_STATE_CHECK_FAILED',
                    error: error.message
                });
            }
        }

        closeConnection();
        return openConnection();
    };

    const invokeSearch = async ({ query, retryOnReconnect = true }) => {
        let methodResult = null;

        try {
            const iris = getIrisClient();
            if (typeof iris.classMethodValue === 'function') {
                methodResult = iris.classMethodValue(config.iris.className, config.iris.methodSearch, query);
            } else if (typeof iris.classMethodObject === 'function') {
                methodResult = iris.classMethodObject(config.iris.className, config.iris.methodSearch, query);
            } else {
                throw new Error('IRIS client does not support classMethodValue/classMethodObject');
            }

            if (typeof methodResult === 'string') {
                return parseSearchResult(methodResult, { methodName: config.iris.methodSearch });
            }

            if (methodResult && typeof methodResult.invokeString === 'function') {
                return parseSearchResult(methodResult.invokeString('%ToJSON'), {
                    methodName: config.iris.methodSearch
                });
            }

            throw createProviderError('User search provider returned unsupported response type', {
                status: 502,
                code: 'USER_SEARCH_PROVIDER_INVALID_RESPONSE',
                reasonCode: 'USER_SEARCH_IRIS_UNSUPPORTED_RESPONSE',
                details: { methodName: config.iris.methodSearch }
            });
        } catch (error) {
            const shouldRetry = retryOnReconnect && isConnectionLikeError(error);
            if (shouldRetry) {
                logger.warn('IRIS user search failed due to connection issue, retrying once', {
                    reason_code: 'USER_SEARCH_IRIS_RECONNECT_RETRY',
                    methodName: config.iris.methodSearch,
                    error: error.message
                });
                closeConnection();
                return invokeSearch({
                    query,
                    retryOnReconnect: false
                });
            }

            if (error?.status && error?.code) {
                throw error;
            }

            throw createProviderError('User search provider invocation failed', {
                status: 502,
                code: 'USER_SEARCH_PROVIDER_CALL_FAILED',
                reasonCode: 'USER_SEARCH_IRIS_CALL_FAILED',
                details: { methodName: config.iris.methodSearch },
                cause: error
            });
        } finally {
            if (methodResult && typeof methodResult.close === 'function') {
                try {
                    methodResult.close();
                } catch (error) {
                    logger.warn('Failed to close IRIS user search result object', {
                        reason_code: 'USER_SEARCH_IRIS_RESULT_CLOSE_FAILED',
                        methodName: config.iris.methodSearch,
                        error: error.message
                    });
                }
            }
        }
    };

    const search = async ({ query }) => {
        const normalized = String(query || '').trim();
        if (!normalized) {
            throw createProviderError('query is required', {
                status: 400,
                code: 'USER_SEARCH_INVALID_INPUT',
                reasonCode: 'USER_SEARCH_IRIS_MISSING_QUERY'
            });
        }

        return invokeSearch({ query: normalized });
    };

    return {
        search,
        close: closeConnection
    };
};

module.exports = {
    createIrisClient
};
