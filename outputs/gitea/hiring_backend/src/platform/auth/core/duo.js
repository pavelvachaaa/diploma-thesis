const { URL } = require('node:url');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { createAuthProviderError, parseJsonSafe } = require('./errors');

module.exports = ({ logger, getDuoConfig, fetchWithTimeout }) => {
    const discoveryCache = new Map();
    const jwksCache = new Map();

    const getOpenIdDiscovery = async (issuer) => {
        const normalizedIssuer = String(issuer || '').replace(/\/$/, '');
        if (!normalizedIssuer) {
            throw createAuthProviderError('Missing AUTH_DUO_ISSUER configuration', {
                status: 500,
                code: 'AUTH_DUO_CONFIG_ERROR'
            });
        }

        if (discoveryCache.has(normalizedIssuer)) {
            return discoveryCache.get(normalizedIssuer);
        }

        const discoveryUrl = `${normalizedIssuer}/.well-known/openid-configuration`;
        const response = await fetchWithTimeout(discoveryUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        const data = await parseJsonSafe(response);
        if (!response.ok || !data?.jwks_uri) {
            throw createAuthProviderError('Failed to load Duo OIDC discovery document', {
                status: 502,
                code: 'AUTH_DUO_DISCOVERY_FAILED'
            });
        }

        if (data.issuer && String(data.issuer).replace(/\/$/, '') !== normalizedIssuer) {
            throw createAuthProviderError('Duo OIDC issuer mismatch', {
                status: 500,
                code: 'AUTH_DUO_ISSUER_MISMATCH'
            });
        }

        discoveryCache.set(normalizedIssuer, data);
        return data;
    };

    const getRemoteJwks = async (jwksUri) => {
        if (jwksCache.has(jwksUri)) {
            return jwksCache.get(jwksUri);
        }

        const jwks = createRemoteJWKSet(new URL(jwksUri));
        jwksCache.set(jwksUri, jwks);
        return jwks;
    };

    const exchangeAuthorizationCode = async ({ code, codeVerifier, redirectUri }) => {
        const config = getDuoConfig();
        if (!code || !codeVerifier || !redirectUri) {
            throw createAuthProviderError('Missing required parameters', {
                status: 400,
                code: 'AUTH_TOKEN_EXCHANGE_INVALID_INPUT',
                error: 'invalid_request'
            });
        }

        if (!config.clientId || !config.clientSecret) {
            throw createAuthProviderError('OAuth configuration error', {
                status: 500,
                code: 'AUTH_DUO_CONFIG_ERROR',
                error: 'server_error'
            });
        }

        if (config.allowedRedirectUris.length > 0 && !config.allowedRedirectUris.includes(redirectUri)) {
            throw createAuthProviderError('Invalid redirect URI', {
                status: 400,
                code: 'AUTH_TOKEN_EXCHANGE_REDIRECT_REJECTED',
                error: 'invalid_request'
            });
        }

        const discovery = await getOpenIdDiscovery(config.issuer);
        const tokenEndpoint = config.tokenUri || discovery.token_endpoint;

        const tokenParams = new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code,
            code_verifier: codeVerifier
        });

        const response = await fetchWithTimeout(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            },
            body: tokenParams.toString()
        });

        const tokenData = await parseJsonSafe(response);
        if (!response.ok || tokenData?.error) {
            throw createAuthProviderError('Token exchange failed', {
                status: response.status || 502,
                code: 'AUTH_TOKEN_EXCHANGE_FAILED',
                error: tokenData?.error || 'token_exchange_failed',
                errorDescription: tokenData?.error_description || null
            });
        }

        return {
            idToken: tokenData?.id_token || null,
            accessToken: tokenData?.access_token || null,
            refreshToken: tokenData?.refresh_token || null,
            tokenType: tokenData?.token_type || 'Bearer',
            expiresIn: tokenData?.expires_in || null
        };
    };

    const verifyCiscoToken = async ({ token }) => {
        if (!token) {
            throw createAuthProviderError('Cisco token is required', {
                status: 400,
                code: 'AUTH_CISCO_TOKEN_MISSING',
                error: 'invalid_request'
            });
        }

        const config = getDuoConfig();
        if (!config.issuer || !config.clientId) {
            throw createAuthProviderError('Duo verification is not configured', {
                status: 500,
                code: 'AUTH_DUO_CONFIG_ERROR',
                error: 'server_error'
            });
        }

        try {
            const discovery = await getOpenIdDiscovery(config.issuer);
            const jwks = await getRemoteJwks(discovery.jwks_uri);

            const { payload } = await jwtVerify(token, jwks, {
                issuer: discovery.issuer || config.issuer,
                audience: config.clientId
            });

            return payload;
        } catch (error) {
            logger.warn('Cisco token verification failed', {
                error: error.message,
                code: error.code || null
            });

            const isExpired = error?.code === 'ERR_JWT_EXPIRED' || error?.name === 'JWTExpired';
            const isClaimError = error?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' || error?.name === 'JWTClaimValidationFailed';

            throw createAuthProviderError('Invalid Cisco token', {
                status: 401,
                code: isExpired ? 'AUTH_CISCO_TOKEN_EXPIRED' : (isClaimError ? 'AUTH_CISCO_TOKEN_CLAIMS_INVALID' : 'AUTH_CISCO_TOKEN_INVALID'),
                error: 'invalid_token'
            });
        }
    };

    return {
        exchangeAuthorizationCode,
        verifyCiscoToken
    };
};
