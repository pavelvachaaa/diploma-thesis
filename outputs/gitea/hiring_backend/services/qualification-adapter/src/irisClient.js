const { createProviderError } = require('./errors');

const isConnectionLikeError = (error) => {
    const text = String(error?.message || '').toLowerCase();
    return text.includes('connection')
        || text.includes('closed')
        || text.includes('socket')
        || text.includes('network')
        || text.includes('timeout');
};

const parseObjectResult = (jsonPayload, { methodName }) => {
    if (!jsonPayload || typeof jsonPayload !== 'string') {
        throw createProviderError('Qualification provider returned empty response', {
            status: 502,
            code: 'QUALIFICATION_PROVIDER_INVALID_RESPONSE',
            reasonCode: 'QUAL_IRIS_EMPTY_RESPONSE',
            details: { methodName }
        });
    }

    try {
        return JSON.parse(jsonPayload);
    } catch (error) {
        throw createProviderError('Qualification provider returned invalid JSON', {
            status: 502,
            code: 'QUALIFICATION_PROVIDER_INVALID_JSON',
            reasonCode: 'QUAL_IRIS_INVALID_JSON',
            details: { methodName },
            cause: error
        });
    }
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
            logger.warn('Failed to close IRIS qualification connection', {
                reason_code: 'QUAL_IRIS_CLOSE_FAILED',
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
            throw createProviderError('Failed to connect to qualification provider', {
                status: 502,
                code: 'QUALIFICATION_PROVIDER_CONNECT_FAILED',
                reasonCode: 'QUAL_IRIS_CONNECT_FAILED',
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
                logger.warn('Failed to read IRIS connection state, recreating connection', {
                    reason_code: 'QUAL_IRIS_STATE_CHECK_FAILED',
                    error: error.message
                });
            }
        }

        closeConnection();
        return openConnection();
    };

    const invokeLookup = async ({ methodName, argument, retryOnReconnect = true }) => {
        let objectResult = null;

        try {
            const iris = getIrisClient();
            objectResult = iris.classMethodObject(config.iris.className, methodName, argument);
            const jsonPayload = objectResult.invokeString('%ToJSON');
            return parseObjectResult(jsonPayload, { methodName });
        } catch (error) {
            const shouldRetry = retryOnReconnect && isConnectionLikeError(error);
            if (shouldRetry) {
                logger.warn('IRIS qualification lookup failed due to connection issue, retrying once', {
                    reason_code: 'QUAL_IRIS_RECONNECT_RETRY',
                    methodName,
                    error: error.message
                });
                closeConnection();
                return invokeLookup({
                    methodName,
                    argument,
                    retryOnReconnect: false
                });
            }

            if (error?.status && error?.code) {
                throw error;
            }

            throw createProviderError('Qualification provider invocation failed', {
                status: 502,
                code: 'QUALIFICATION_PROVIDER_CALL_FAILED',
                reasonCode: 'QUAL_IRIS_CALL_FAILED',
                details: { methodName },
                cause: error
            });
        } finally {
            if (objectResult && typeof objectResult.close === 'function') {
                try {
                    objectResult.close();
                } catch (error) {
                    logger.warn('Failed to close IRIS result object', {
                        reason_code: 'QUAL_IRIS_RESULT_CLOSE_FAILED',
                        methodName,
                        error: error.message
                    });
                }
            }
        }
    };

    const lookupByWorkerNumber = async ({ pracovnikNrzpCislo }) => {
        const normalized = String(pracovnikNrzpCislo || '').trim();
        if (!normalized) {
            throw createProviderError('pracovnikNrzpCislo is required', {
                status: 400,
                code: 'QUALIFICATION_INVALID_INPUT',
                reasonCode: 'QUAL_IRIS_MISSING_NRZP'
            });
        }

        return invokeLookup({
            methodName: config.iris.methodByNrzp,
            argument: normalized
        });
    };

    const lookupByBirthNumber = async ({ rodneCislo }) => {
        const normalized = String(rodneCislo || '').trim();
        if (!normalized) {
            throw createProviderError('rodneCislo is required', {
                status: 400,
                code: 'QUALIFICATION_INVALID_INPUT',
                reasonCode: 'QUAL_IRIS_MISSING_BIRTH_NUMBER'
            });
        }

        return invokeLookup({
            methodName: config.iris.methodByBirthNumber,
            argument: normalized
        });
    };

    return {
        lookupByWorkerNumber,
        lookupByBirthNumber,
        close: closeConnection
    };
};

module.exports = {
    createIrisClient
};
