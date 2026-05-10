const test = require('node:test');
const assert = require('node:assert/strict');

const { createIrisClient } = require('../src/irisClient');

const createLogger = () => ({
    warn: () => {},
    error: () => {},
    info: () => {}
});

const baseConfig = {
    iris: {
        host: 'iris.example.com',
        port: 1972,
        namespace: 'UCP',
        user: 'svc-user',
        password: 'svc-pass',
        className: 'UCP.JoinKZ.Users.Api',
        methodSearch: 'Search',
        timeoutMs: 8000
    }
};

test('invokes configured IRIS class method for user search', async () => {
    const classMethodValue = (...args) => {
        classMethodValue.calls.push(args);
        return JSON.stringify([
            { id: '272', fullName: 'Pavel Vácha' }
        ]);
    };
    classMethodValue.calls = [];

    const irisNativeModule = {
        createConnection: () => ({
            createIris: () => ({
                classMethodValue
            }),
            close: () => {},
            isClosed: () => false
        })
    };

    const client = createIrisClient({
        logger: createLogger(),
        config: baseConfig,
        irisNativeModule
    });

    const result = await client.search({ query: 'Pavel' });
    assert.equal(result[0].id, '272');
    assert.deepEqual(classMethodValue.calls[0], ['UCP.JoinKZ.Users.Api', 'Search', 'Pavel']);
});

test('maps invalid JSON payload to controlled error', async () => {
    const irisNativeModule = {
        createConnection: () => ({
            createIris: () => ({
                classMethodValue: () => '[{'
            }),
            close: () => {},
            isClosed: () => false
        })
    };

    const client = createIrisClient({
        logger: createLogger(),
        config: baseConfig,
        irisNativeModule
    });

    await assert.rejects(
        () => client.search({ query: 'Pavel' }),
        (error) => error.code === 'USER_SEARCH_PROVIDER_INVALID_JSON'
            && error.reason_code === 'USER_SEARCH_IRIS_INVALID_JSON'
    );
});
