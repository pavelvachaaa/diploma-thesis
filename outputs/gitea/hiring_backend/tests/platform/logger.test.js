describe('platform/logger', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        process.env = {
            ...originalEnv,
            LOG_PRETTY: 'false',
            LOG_INCLUDE_STACK: 'false',
            NODE_ENV: 'production'
        };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        jest.clearAllMocks();
    });

    const loadLogger = ({ context } = {}) => {
        const pinoInstance = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            fatal: jest.fn(),
            trace: jest.fn(),
            silent: jest.fn(),
            child: jest.fn(() => pinoInstance),
            level: 'info',
            levels: { values: {} }
        };

        const pinoFactory = jest.fn(() => pinoInstance);
        pinoFactory.stdTimeFunctions = { isoTime: () => 'now' };
        pinoFactory.stdSerializers = {};

        jest.doMock('pino', () => pinoFactory);
        jest.doMock('@shared/requestContext', () => ({
            getRequestContext: () => context || {}
        }));

        // eslint-disable-next-line global-require
        const logger = require('../../src/platform/logger');
        return { logger, pinoInstance };
    };

    it('adds request/user/org bindings to structured logs', () => {
        const { logger, pinoInstance } = loadLogger({
            context: {
                requestId: 'req-1',
                userId: 'user-1',
                organizationId: 'org-1',
                organizationIds: ['org-1'],
                method: 'GET',
                path: '/api/test'
            }
        });

        logger.info('test message', { feature: 'logging' });

        expect(pinoInstance.info).toHaveBeenCalledWith(
            expect.objectContaining({
                request_id: 'req-1',
                user_id: 'user-1',
                org_id: 'org-1',
                org_ids: ['org-1'],
                method: 'GET',
                path: '/api/test',
                feature: 'logging'
            }),
            'test message'
        );
    });

    it('serializes Error payloads without stack when LOG_INCLUDE_STACK=false', () => {
        const { logger, pinoInstance } = loadLogger();
        const error = new Error('boom');

        logger.error(error);

        expect(pinoInstance.error).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.objectContaining({
                    message: 'boom'
                })
            }),
            'boom'
        );

        const payload = pinoInstance.error.mock.calls[0][0];
        expect(payload.error.stack).toBeUndefined();
    });

    it('redacts secret-like keys from metadata', () => {
        const { logger, pinoInstance } = loadLogger();

        logger.info('secret test', {
            token: 'abc123',
            nested: {
                password: 'pass',
                refreshToken: 'refresh'
            }
        });

        expect(pinoInstance.info).toHaveBeenCalledWith(
            expect.objectContaining({
                token: '[REDACTED]',
                nested: {
                    password: '[REDACTED]',
                    refreshToken: '[REDACTED]'
                }
            }),
            'secret test'
        );
    });
});
