const { EventEmitter } = require('events');

const mockLoggerInfo = jest.fn();

jest.mock('@platform/logger', () => ({
    info: (...args) => mockLoggerInfo(...args)
}));

let mockContext = {};

jest.mock('@shared/requestContext', () => ({
    getRequestContext: () => mockContext
}));

const { accessLogMiddleware } = require('../../src/middlewares/accessLog.middleware');

describe('middlewares/accessLog.middleware', () => {
    const originalEnv = { ...process.env };

    const createReqRes = () => {
        const req = {
            method: 'GET',
            originalUrl: '/api/v1/jobs',
            url: '/api/v1/jobs',
            ip: '127.0.0.1',
            get: jest.fn((key) => (key === 'user-agent' ? 'jest-agent' : null))
        };

        const res = new EventEmitter();
        res.statusCode = 200;

        return { req, res };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            LOG_HTTP_ACCESS_MODE: 'errors_and_slow',
            LOG_HTTP_SLOW_MS: '2000'
        };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('logs failed requests', () => {
        const { req, res } = createReqRes();
        mockContext = {
            requestId: 'req-1',
            userId: 'user-1',
            organizationId: 'org-1',
            requestStartAt: Date.now()
        };

        const next = jest.fn();
        accessLogMiddleware(req, res, next);

        res.statusCode = 500;
        res.emit('finish');

        expect(next).toHaveBeenCalled();
        expect(mockLoggerInfo).toHaveBeenCalledWith(
            'HTTP request completed',
            expect.objectContaining({
                request_id: 'req-1',
                user_id: 'user-1',
                org_id: 'org-1',
                status_code: 500
            })
        );
    });

    it('logs slow successful requests', () => {
        const { req, res } = createReqRes();
        mockContext = {
            requestId: 'req-2',
            requestStartAt: Date.now() - 3000
        };

        accessLogMiddleware(req, res, jest.fn());
        res.statusCode = 200;
        res.emit('finish');

        expect(mockLoggerInfo).toHaveBeenCalledWith(
            'HTTP request completed',
            expect.objectContaining({
                request_id: 'req-2',
                status_code: 200,
                duration_ms: expect.any(Number)
            })
        );

        const payload = mockLoggerInfo.mock.calls[0][1];
        expect(payload.duration_ms).toBeGreaterThanOrEqual(2000);
    });

    it('does not log fast successful requests', () => {
        const { req, res } = createReqRes();
        mockContext = {
            requestId: 'req-3',
            requestStartAt: Date.now()
        };

        accessLogMiddleware(req, res, jest.fn());
        res.statusCode = 200;
        res.emit('finish');

        expect(mockLoggerInfo).not.toHaveBeenCalled();
    });
});
