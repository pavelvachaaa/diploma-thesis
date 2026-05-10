const createQualificationProviderAdapter = require('../../src/adapters/out/integration/qualification/provider');

const createLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn()
});

const createJsonResponse = ({ statusCode = 200, payload = {} } = {}) => ({
    statusCode,
    body: {
        json: jest.fn().mockResolvedValue(payload)
    }
});

describe('qualification provider adapter', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            QUAL_ADAPTER_BASE_URL: 'http://qualification-adapter:8088',
            QUAL_ADAPTER_AUTH_TOKEN: 'service-secret-token',
            QUAL_ADAPTER_TIMEOUT_MS: '5000'
        };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('sends bearer token and calls worker-number endpoint', async () => {
        const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({
            payload: {
                status: 1,
                data: {
                    Success: 1,
                    Stav: 'OK',
                    Operation: 'LookupByWorkerNumber',
                    PocetPracovniku: 1,
                    Pracovnik: {
                        NrzpCislo: '122036563',
                        Jmeno: 'Jan',
                        Prijmeni: 'Váchal',
                        DatumNarozeni: '1985-01-01',
                        StatniObcanstvi: 'CZ'
                    },
                    SeznamPracovniku: [{
                        NrzpCislo: '122036563',
                        Jmeno: 'Jan',
                        Prijmeni: 'Váchal',
                        DatumNarozeni: '1985-01-01',
                        StatniObcanstvi: 'CZ'
                    }],
                    Kvalifikace: {
                        OdborneZpusobilosti: [{
                            NrzpCislo: '122036563',
                            TypZpusobilosti: 'odborna',
                            Obor: 'praktické lékařství',
                            Odbornost: null
                        }],
                        SpecializovaneZpusobilosti: [],
                        ZvlastniOdborneZpusobilosti: []
                    }
                }
            }
        }));
        const adapter = createQualificationProviderAdapter(
            { logger: createLogger() },
            { request: mockRequest }
        );

        const result = await adapter.lookupByWorkerNumber({
            workerNumber: '122036563'
        });

        expect(mockRequest).toHaveBeenCalledWith(
            new URL('/internal/qualification/lookup/by-worker-number', 'http://qualification-adapter:8088'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    authorization: 'Bearer service-secret-token',
                    'content-type': 'application/json'
                }),
                body: JSON.stringify({ pracovnikNrzpCislo: '122036563' })
            })
        );
        expect(result).toEqual({
            worker: {
                nrzpCislo: '122036563',
                jmeno: 'Jan',
                prijmeni: 'Váchal',
                datumNarozeni: '1985-01-01',
                statniObcanstvi: 'CZ'
            },
            workers: [{
                nrzpCislo: '122036563',
                jmeno: 'Jan',
                prijmeni: 'Váchal',
                datumNarozeni: '1985-01-01',
                statniObcanstvi: 'CZ'
            }],
            qualifications: {
                odborneZpusobilosti: [{
                    nrzpCislo: '122036563',
                    typZpusobilosti: 'odborna',
                    obor: 'praktické lékařství',
                    odbornost: null
                }],
                specializovaneZpusobilosti: [],
                zvlastniOdborneZpusobilosti: []
            },
            counts: {
                workers: 1,
                odborneZpusobilosti: 1,
                specializovaneZpusobilosti: 0,
                zvlastniOdborneZpusobilosti: 0
            },
            upstream: {
                status: 1,
                success: 1,
                stav: 'OK',
                message: null,
                error: null,
                operation: 'LookupByWorkerNumber'
            }
        });
    });

    it('calls birth-number endpoint', async () => {
        const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({
            payload: { status: 1, data: { Success: 1 } }
        }));
        const adapter = createQualificationProviderAdapter(
            { logger: createLogger() },
            { request: mockRequest }
        );

        await adapter.lookupByBirthNumber({
            birthNumber: '8501011234'
        });

        expect(mockRequest).toHaveBeenCalledWith(
            new URL('/internal/qualification/lookup/by-birth-number', 'http://qualification-adapter:8088'),
            expect.objectContaining({
                body: JSON.stringify({ rodneCislo: '8501011234' })
            })
        );
    });

    it('returns controlled config error when token is missing', async () => {
        delete process.env.QUAL_ADAPTER_AUTH_TOKEN;
        const adapter = createQualificationProviderAdapter(
            { logger: createLogger() },
            { request: jest.fn() }
        );

        await expect(adapter.lookupByWorkerNumber({
            workerNumber: '122036563'
        })).rejects.toMatchObject({
            status: 503,
            code: 'QUALIFICATION_PROVIDER_DISABLED',
            reason_code: 'QUAL_ADAPTER_CONFIG_MISSING'
        });
    });

    it('maps adapter auth rejection to controlled unavailable error', async () => {
        const mockRequest = jest.fn().mockResolvedValue(createJsonResponse({
            statusCode: 401,
            payload: {
                error: 'Unauthorized',
                code: 'QUAL_ADAPTER_UNAUTHORIZED',
                reason_code: 'QUAL_ADAPTER_UNAUTHORIZED'
            }
        }));
        const adapter = createQualificationProviderAdapter(
            { logger: createLogger() },
            { request: mockRequest }
        );

        await expect(adapter.lookupByWorkerNumber({
            workerNumber: '122036563'
        })).rejects.toMatchObject({
            status: 503,
            code: 'QUALIFICATION_PROVIDER_UNAVAILABLE',
            reason_code: 'QUAL_ADAPTER_AUTH_REJECTED'
        });
    });

    it('maps timeout-like request failures to provider unavailable', async () => {
        const timeoutError = new Error('headers timeout');
        timeoutError.code = 'UND_ERR_HEADERS_TIMEOUT';

        const mockRequest = jest.fn().mockRejectedValue(timeoutError);
        const adapter = createQualificationProviderAdapter(
            { logger: createLogger() },
            { request: mockRequest }
        );

        await expect(adapter.lookupByWorkerNumber({
            workerNumber: '122036563'
        })).rejects.toMatchObject({
            status: 503,
            code: 'QUALIFICATION_PROVIDER_UNAVAILABLE',
            reason_code: 'QUAL_ADAPTER_TIMEOUT'
        });
    });

    it('maps invalid JSON payload from adapter to controlled error', async () => {
        const mockRequest = jest.fn().mockResolvedValue({
            statusCode: 200,
            body: {
                json: jest.fn().mockRejectedValue(new Error('invalid json'))
            }
        });
        const adapter = createQualificationProviderAdapter(
            { logger: createLogger() },
            { request: mockRequest }
        );

        await expect(adapter.lookupByWorkerNumber({
            workerNumber: '122036563'
        })).rejects.toMatchObject({
            status: 502,
            code: 'QUALIFICATION_PROVIDER_INVALID_RESPONSE',
            reason_code: 'QUAL_ADAPTER_INVALID_JSON'
        });
    });
});
