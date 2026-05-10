const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const createPlatformAuth = require('../../src/platform/auth');

const createMockLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn()
});

const startTestServer = async ({ jwks, issuerPath, tokenResponse, ucpResponse, onUcpRequest }) => {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');

        if (url.pathname === `${issuerPath}/.well-known/openid-configuration`) {
            const origin = `http://127.0.0.1:${server.address().port}`;
            const issuer = `${origin}${issuerPath}`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                issuer,
                jwks_uri: `${issuer}/jwks`,
                token_endpoint: `${issuer}/token`
            }));
            return;
        }

        if (url.pathname === `${issuerPath}/jwks`) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ keys: [jwks] }));
            return;
        }

        if (url.pathname === `${issuerPath}/token`) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(tokenResponse));
            return;
        }

        if (url.pathname === '/ucp') {
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
                const bodyRaw = Buffer.concat(chunks).toString('utf8');
                let body = null;
                try {
                    body = bodyRaw ? JSON.parse(bodyRaw) : null;
                } catch {
                    body = null;
                }

                if (typeof onUcpRequest === 'function') {
                    onUcpRequest({
                        headers: req.headers,
                        body
                    });
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(ucpResponse));
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not_found' }));
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    return server;
};

describe('platform/auth adapter', () => {
    const originalEnv = { ...process.env };
    let server;
    let authAdapter;
    let privateKey;
    let issuer;
    let clientId;
    let ucpRequests;

    beforeEach(async () => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        ucpRequests = [];

        const keyPair = await generateKeyPair('RS256');
        privateKey = keyPair.privateKey;
        const publicJwk = await exportJWK(keyPair.publicKey);
        publicJwk.kid = 'test-key';
        publicJwk.use = 'sig';
        publicJwk.alg = 'RS256';

        const issuerPath = '/oidc/test-client';
        server = await startTestServer({
            jwks: publicJwk,
            issuerPath,
            tokenResponse: {
                id_token: 'id-token',
                access_token: 'access-token',
                refresh_token: 'refresh-token',
                token_type: 'Bearer',
                expires_in: 3600
            },
            ucpResponse: {
                data: {
                    email: 'user@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    seatLocation: 'LOC1'
                }
            },
            onUcpRequest: (payload) => {
                ucpRequests.push(payload);
            }
        });

        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        issuer = `${baseUrl}${issuerPath}`;
        clientId = 'test-client-id';

        process.env.AUTH_DUO_ISSUER = issuer;
        process.env.AUTH_DUO_CLIENT_ID = clientId;
        process.env.AUTH_DUO_CLIENT_SECRET = 'secret';
        process.env.AUTH_DUO_TOKEN_URI = `${issuer}/token`;
        process.env.AUTH_DUO_ALLOWED_REDIRECT_URIS = `${baseUrl}/callback`;
        process.env.AUTH_UCP_API_URL = `${baseUrl}/ucp`;
        process.env.AUTH_HTTP_TIMEOUT_MS = '5000';

        authAdapter = createPlatformAuth({
            logger: createMockLogger()
        });
    });

    afterEach(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        process.env = { ...originalEnv };
    });

    it('verifies Cisco token using JWKS and issuer/audience checks', async () => {
        const token = await new SignJWT({
            email: 'user@example.com',
            given_name: 'John',
            family_name: 'Doe'
        })
            .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
            .setIssuer(issuer)
            .setAudience(clientId)
            .setSubject('subject-1')
            .setExpirationTime('5m')
            .sign(privateKey);

        const payload = await authAdapter.verifyCiscoToken({ token });

        expect(payload.email).toBe('user@example.com');
        expect(payload.sub).toBe('subject-1');
    });

    it('rejects Cisco token with invalid audience', async () => {
        const token = await new SignJWT({ email: 'user@example.com' })
            .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
            .setIssuer(issuer)
            .setAudience('other-client')
            .setSubject('subject-1')
            .setExpirationTime('5m')
            .sign(privateKey);

        await expect(authAdapter.verifyCiscoToken({ token })).rejects.toMatchObject({
            status: 401
        });
    });

    it('rejects Cisco token when expired', async () => {
        const token = await new SignJWT({ email: 'user@example.com' })
            .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
            .setIssuer(issuer)
            .setAudience(clientId)
            .setSubject('subject-1')
            .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
            .sign(privateKey);

        await expect(authAdapter.verifyCiscoToken({ token })).rejects.toMatchObject({
            status: 401
        });
    });

    it('exchanges authorization code and normalizes token payload', async () => {
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const result = await authAdapter.exchangeAuthorizationCode({
            code: 'auth-code',
            codeVerifier: 'verifier',
            redirectUri: `${baseUrl}/callback`
        });

        expect(result).toEqual({
            idToken: 'id-token',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600
        });
    });

    it('rejects redirectUri outside allowlist', async () => {
        await expect(authAdapter.exchangeAuthorizationCode({
            code: 'auth-code',
            codeVerifier: 'verifier',
            redirectUri: 'https://evil.example.com/callback'
        })).rejects.toMatchObject({
            status: 400,
            code: 'AUTH_TOKEN_EXCHANGE_REDIRECT_REJECTED'
        });
    });

    it('fetches UCP user info via platform adapter', async () => {
        const result = await authAdapter.fetchUcpUserInfo({
            idToken: 'id-token'
        });

        expect(result).toEqual({
            data: {
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                seatLocation: 'LOC1'
            }
        });

        expect(ucpRequests[0].headers.authorization).toBe('Bearer id-token');
        expect(ucpRequests[0].body).toMatchObject({
            module: 'mobile-api-pzm',
            fct: 'GetUserInfoForHRBackend'
        });
    });

});
