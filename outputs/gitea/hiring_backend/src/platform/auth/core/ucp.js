const { createAuthProviderError, parseJsonSafe } = require('./errors');

module.exports = ({ getUcpConfig, fetchWithTimeout, getUcpInsecureDispatcher }) => {
    const fetchUcpUserInfo = async ({ idToken }) => {
        if (!idToken) {
            throw createAuthProviderError('idToken is required', {
                status: 400,
                code: 'AUTH_UCP_INVALID_INPUT',
                error: 'invalid_request'
            });
        }

        const ucpConfig = getUcpConfig();
        const requestPayload = {
            module: ucpConfig.moduleName,
            fct: ucpConfig.functionName
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
                Accept: 'application/json'
            },
            body: JSON.stringify(requestPayload)
        };

        if (ucpConfig.insecureTls) {
            requestOptions.dispatcher = getUcpInsecureDispatcher();
        }

        const response = await fetchWithTimeout(ucpConfig.apiUrl, requestOptions);
        const data = await parseJsonSafe(response);

        if (!response.ok) {
            throw createAuthProviderError(`UCP API error: ${response.status}`, {
                status: 502,
                code: 'AUTH_UCP_FETCH_FAILED',
                error: 'ucp_fetch_failed'
            });
        }

        return data;
    };

    return {
        fetchUcpUserInfo
    };
};
