const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../src/app');

const createLogger = () => ({
    info: () => {},
    warn: () => {},
    error: () => {}
});

const startServer = (app) => new Promise((resolve) => {
    const server = app.listen(0, () => {
        const address = server.address();
        resolve({
            server,
            baseUrl: `http://127.0.0.1:${address.port}`
        });
    });
});

test('rejects requests without internal bearer token', async () => {
    const app = createApp({
        logger: createLogger(),
        config: { authToken: 'secret-token' },
        irisClient: {
            search: async () => []
        }
    });

    const { server, baseUrl } = await startServer(app);
    const response = await fetch(`${baseUrl}/internal/users/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'Pavel' })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.code, 'USER_SEARCH_ADAPTER_UNAUTHORIZED');

    await new Promise((resolve) => server.close(resolve));
});

test('allows authorized search requests', async () => {
    const app = createApp({
        logger: createLogger(),
        config: { authToken: 'secret-token' },
        irisClient: {
            search: async ({ query }) => ([
                { id: '272', fullName: query }
            ])
        }
    });

    const { server, baseUrl } = await startServer(app);
    const response = await fetch(`${baseUrl}/internal/users/search`, {
        method: 'POST',
        headers: {
            authorization: 'Bearer secret-token',
            'content-type': 'application/json'
        },
        body: JSON.stringify({ query: 'Pavel Vácha' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload[0].id, '272');

    await new Promise((resolve) => server.close(resolve));
});
