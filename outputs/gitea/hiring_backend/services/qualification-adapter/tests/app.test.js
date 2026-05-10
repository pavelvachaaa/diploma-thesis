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
            lookupByWorkerNumber: async () => ({ status: 1 }),
            lookupByBirthNumber: async () => ({ status: 1 })
        }
    });

    const { server, baseUrl } = await startServer(app);
    const response = await fetch(`${baseUrl}/internal/qualification/lookup/by-worker-number`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pracovnikNrzpCislo: '123' })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.code, 'QUAL_ADAPTER_UNAUTHORIZED');

    await new Promise((resolve) => server.close(resolve));
});

test('allows authorized lookup requests', async () => {
    const app = createApp({
        logger: createLogger(),
        config: { authToken: 'secret-token' },
        irisClient: {
            lookupByWorkerNumber: async ({ pracovnikNrzpCislo }) => ({
                status: 1,
                data: { worker: pracovnikNrzpCislo }
            }),
            lookupByBirthNumber: async () => ({ status: 1 })
        }
    });

    const { server, baseUrl } = await startServer(app);
    const response = await fetch(`${baseUrl}/internal/qualification/lookup/by-worker-number`, {
        method: 'POST',
        headers: {
            authorization: 'Bearer secret-token',
            'content-type': 'application/json'
        },
        body: JSON.stringify({ pracovnikNrzpCislo: '123' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, 1);

    await new Promise((resolve) => server.close(resolve));
});
