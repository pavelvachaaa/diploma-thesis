const { createAuthProviderError } = require('./errors');

module.exports = ({ getTimeoutMs }) => {
    let insecureUcpDispatcher = null;

    const fetchWithTimeout = async (url, options = {}) => {
        const controller = new AbortController();
        const timeoutMs = getTimeoutMs();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } catch (error) {
            if (error?.name === 'AbortError') {
                throw createAuthProviderError('Auth provider request timed out', {
                    status: 504,
                    code: 'AUTH_PROVIDER_TIMEOUT'
                });
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    };

    const getUcpInsecureDispatcher = () => {
        if (insecureUcpDispatcher) {
            return insecureUcpDispatcher;
        }

        try {
            const { Agent } = require('undici');
            insecureUcpDispatcher = new Agent({
                connect: { rejectUnauthorized: false }
            });
            return insecureUcpDispatcher;
        } catch (_error) {
            throw createAuthProviderError('Insecure UCP TLS mode is unavailable in this runtime', {
                status: 500,
                code: 'AUTH_UCP_TLS_CONFIG_ERROR'
            });
        }
    };

    return {
        fetchWithTimeout,
        getUcpInsecureDispatcher
    };
};
