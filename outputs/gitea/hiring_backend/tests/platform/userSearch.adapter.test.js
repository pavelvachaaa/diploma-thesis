const createInternalUserDirectory = require('../../src/adapters/out/integration/internalUsers');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const createLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn()
});

const validConfig = Object.freeze({
    baseUrl: 'http://user-search-adapter:8089',
    authToken: 'service-secret-token',
    timeoutMs: 5000
});

const createJsonResponse = ({ statusCode = 200, payload = {} } = {}) => ({
    statusCode,
    body: { json: jest.fn().mockResolvedValue(payload) }
});

const makeAdapter = (configOverrides = {}, mockRequest = jest.fn()) =>
    createInternalUserDirectory(
        { logger: createLogger(), userSearchAdapterConfig: { ...validConfig, ...configOverrides } },
        { request: mockRequest }
    );

describe('internalUserDirectory adapter', () => {
    describe('construction', () => {
        it('constructs successfully even when auth token is missing (feature-disabled state)', () => {
            expect(() => makeAdapter({ authToken: null })).not.toThrow();
        });

        it('throws UPSTREAM_MISCONFIGURED on first call when auth token is missing', async () => {
            const adapter = makeAdapter({ authToken: null });
            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_MISCONFIGURED
            });
        });
    });

    describe('searchUsers', () => {
        it('sends bearer token and calls search endpoint with the query', async () => {
            const externalPayload = [{ id: '272', name: 'Pavel', surname: 'Vácha', email: 'p@kzcr.eu', seatLocation: 'CE' }];
            const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({ payload: externalPayload }));
            const adapter = makeAdapter({}, mockRequest);

            await adapter.searchUsers({ query: 'Pavel Vácha' });

            expect(mockRequest).toHaveBeenCalledWith(
                new URL('/internal/users/search', 'http://user-search-adapter:8089'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        authorization: 'Bearer service-secret-token',
                        'content-type': 'application/json'
                    }),
                    body: JSON.stringify({ query: 'Pavel Vácha' })
                })
            );
        });

        it('applies the ACL — maps external payload to internal domain shape', async () => {
            const externalPayload = [
                { id: '272', name: 'Pavel', surname: 'Vácha', fullName: 'Pavel Vácha', email: 'Pavel.Vacha@KZCR.EU', seatLocation: 'CE' },
                { id: '273', name: 'Jana', surname: 'Nováková', fullName: 'Jana Nováková', email: 'jana@kzcr.eu', seatLocation: 'UL' }
            ];
            const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({ payload: externalPayload }));
            const adapter = makeAdapter({}, mockRequest);

            const result = await adapter.searchUsers({ query: 'Jana' });

            expect(result).toEqual([
                expect.objectContaining({
                    id: '272',
                    name: 'Pavel',
                    surname: 'Vácha',
                    fullName: 'Pavel Vácha',
                    email: 'p.vacha@example.com',  // lowercased by ACL
                    seatLocation: 'CE'
                }),
                expect.objectContaining({
                    email: 'jana@kzcr.eu',
                    seatLocation: 'UL'
                })
            ]);
        });

        it('filters null entries produced by the ACL when raw items are non-objects', async () => {
            const externalPayload = [
                { id: '272', name: 'Pavel', email: 'p@kzcr.eu', seatLocation: 'CE' },
                null,
                'unexpected string'
            ];
            const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({ payload: externalPayload }));
            const adapter = makeAdapter({}, mockRequest);

            const result = await adapter.searchUsers({ query: 'Pavel' });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ id: '272' });
        });

        it('maps auth rejection from upstream to UPSTREAM_UNAVAILABLE', async () => {
            const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({
                statusCode: 401,
                payload: { error: 'Unauthorized' }
            }));
            const adapter = makeAdapter({}, mockRequest);

            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_UNAVAILABLE,
                details: expect.objectContaining({ reasonCode: 'USER_SEARCH_ADAPTER_AUTH_REJECTED' })
            });
        });

        it('maps timeout-like request failures to UPSTREAM_UNAVAILABLE', async () => {
            const timeoutError = new Error('headers timeout');
            timeoutError.code = 'UND_ERR_HEADERS_TIMEOUT';
            const mockRequest = jest.fn().mockRejectedValue(timeoutError);
            const adapter = makeAdapter({}, mockRequest);

            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_UNAVAILABLE,
                details: expect.objectContaining({ reasonCode: 'USER_SEARCH_ADAPTER_TIMEOUT' })
            });
        });

        it('maps non-timeout request failures to UPSTREAM_UNAVAILABLE', async () => {
            const mockRequest = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
            const adapter = makeAdapter({}, mockRequest);

            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_UNAVAILABLE,
                details: expect.objectContaining({ reasonCode: 'USER_SEARCH_ADAPTER_REQUEST_FAILED' })
            });
        });

        it('maps invalid JSON from upstream to UPSTREAM_ERROR', async () => {
            const mockRequest = jest.fn().mockResolvedValue({
                statusCode: 200,
                body: { json: jest.fn().mockRejectedValue(new Error('invalid json')) }
            });
            const adapter = makeAdapter({}, mockRequest);

            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_ERROR,
                details: expect.objectContaining({ reasonCode: 'USER_SEARCH_ADAPTER_INVALID_JSON' })
            });
        });

        it('maps non-array payload shape from upstream to UPSTREAM_ERROR', async () => {
            const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({
                payload: { items: [] }  // object instead of array
            }));
            const adapter = makeAdapter({}, mockRequest);

            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_ERROR,
                details: expect.objectContaining({ reasonCode: 'USER_SEARCH_ADAPTER_INVALID_PAYLOAD' })
            });
        });

        it('maps upstream 5xx to UPSTREAM_ERROR', async () => {
            const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({
                statusCode: 503,
                payload: { error: 'Service Unavailable' }
            }));
            const adapter = makeAdapter({}, mockRequest);

            await expect(adapter.searchUsers({ query: 'Pavel' })).rejects.toMatchObject({
                code: ErrorCode.UPSTREAM_ERROR
            });
        });
    });
});
