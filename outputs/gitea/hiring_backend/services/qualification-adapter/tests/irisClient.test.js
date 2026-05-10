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
        className: 'UCP.UZIS.ApiTest',
        methodByNrzp: 'ByNrzp',
        methodByBirthNumber: 'ByRc',
        timeoutMs: 8000
    }
};

test('invokes configured IRIS class method for worker number', async () => {
    const objectResult = {
        invokeString: () => JSON.stringify({ status: 1, data: { Success: 1 } }),
        close: () => {}
    };
    const classMethodObject = (...args) => {
        classMethodObject.calls.push(args);
        return objectResult;
    };
    classMethodObject.calls = [];

    const irisNativeModule = {
        createConnection: () => ({
            createIris: () => ({
                classMethodObject
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

    const result = await client.lookupByWorkerNumber({ pracovnikNrzpCislo: '123' });
    assert.equal(result.status, 1);
    assert.deepEqual(classMethodObject.calls[0], ['UCP.UZIS.ApiTest', 'ByNrzp', '123']);
});

test('maps invalid JSON payload to controlled error', async () => {
    const irisNativeModule = {
        createConnection: () => ({
            createIris: () => ({
                classMethodObject: () => ({
                    invokeString: () => '{"status":1',
                    close: () => {}
                })
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
        () => client.lookupByWorkerNumber({ pracovnikNrzpCislo: '123' }),
        (error) => error.code === 'QUALIFICATION_PROVIDER_INVALID_JSON'
            && error.reason_code === 'QUAL_IRIS_INVALID_JSON'
    );
});
