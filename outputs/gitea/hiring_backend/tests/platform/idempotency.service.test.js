const createIdempotencyService = require('../../src/platform/idempotency');
const { createMockLogger } = require('../helpers');

const buildRepository = () => ({
    reclaimStaleInProgress: jest.fn().mockResolvedValue(null),
    insertInProgress: jest.fn().mockResolvedValue({
        id: 'idem-1',
        status: 'in_progress',
        request_hash: 'hash-1'
    }),
    findByScopeAndKey: jest.fn().mockResolvedValue(null),
    markCompleted: jest.fn().mockResolvedValue({}),
    markFailed: jest.fn().mockResolvedValue({}),
    deleteExpired: jest.fn().mockResolvedValue(0),
    getExpiredStats: jest.fn().mockResolvedValue({
        byScopeStatus: [],
        byAgeBucket: []
    })
});

describe('platform/idempotency service', () => {
    it('executes handler directly when key is absent', async () => {
        const repository = buildRepository();
        const service = createIdempotencyService({
            commandIdempotencyRepository: repository,
            logger: createMockLogger()
        });

        const result = await service.execute({
            scope: 'chat.sendMessage',
            idempotencyKey: null,
            request: {}
        }, async () => ({ statusCode: 201, body: { ok: true } }));

        expect(result).toEqual({
            statusCode: 201,
            body: { ok: true }
        });
        expect(repository.insertInProgress).not.toHaveBeenCalled();
    });

    it('returns replayed response for completed command', async () => {
        const repository = buildRepository();
        repository.insertInProgress.mockResolvedValue(null);
        repository.findByScopeAndKey.mockResolvedValue({
            id: 'idem-1',
            status: 'completed',
            request_hash: null,
            response_status: 201,
            response_body: { id: 'msg-1' }
        });

        const service = createIdempotencyService({
            commandIdempotencyRepository: repository,
            logger: createMockLogger()
        });
        const request = { method: 'POST', path: '/chat/u/messages', body: { body: 'hello' } };
        const hash = service.hashRequest(request);
        repository.findByScopeAndKey.mockResolvedValue({
            id: 'idem-1',
            status: 'completed',
            request_hash: hash,
            response_status: 201,
            response_body: { id: 'msg-1' }
        });

        const result = await service.execute({
            scope: 'chat.sendMessage',
            idempotencyKey: 'k-1',
            request
        }, async () => ({ statusCode: 201, body: { id: 'should-not-run' } }));

        expect(result).toEqual({
            statusCode: 201,
            body: { id: 'msg-1' },
            replayed: true
        });
    });

    it('stores successful response after first execution', async () => {
        const repository = buildRepository();
        const service = createIdempotencyService({
            commandIdempotencyRepository: repository,
            logger: createMockLogger()
        });

        const result = await service.execute({
            scope: 'applicants.createAdmin',
            idempotencyKey: 'k-2',
            request: { method: 'POST', path: '/admin/applicants', body: { name: 'Jan' } }
        }, async () => ({ statusCode: 201, body: { id: 'app-1' } }));

        expect(result).toEqual({
            statusCode: 201,
            body: { id: 'app-1' },
            replayed: false
        });
        expect(repository.markCompleted).toHaveBeenCalledWith({
            id: 'idem-1',
            responseStatus: 201,
            responseBody: { id: 'app-1' }
        });
    });

    it('marks failed when handler throws', async () => {
        const repository = buildRepository();
        const service = createIdempotencyService({
            commandIdempotencyRepository: repository,
            logger: createMockLogger()
        });

        await expect(service.execute({
            scope: 'interviews.create',
            idempotencyKey: 'k-3',
            request: { method: 'POST', path: '/admin/interviews', body: { title: 'Interview' } }
        }, async () => {
            throw new Error('boom');
        })).rejects.toThrow('boom');

        expect(repository.markFailed).toHaveBeenCalledWith({
            id: 'idem-1',
            errorMessage: 'boom'
        });
    });

    it('cleans up expired idempotency rows', async () => {
        const repository = buildRepository();
        repository.deleteExpired.mockResolvedValue(7);

        const service = createIdempotencyService({
            commandIdempotencyRepository: repository,
            logger: createMockLogger()
        });

        const result = await service.cleanupExpired({
            limit: 25
        });

        expect(result).toEqual({
            deleted: 7,
            stats: {
                byScopeStatus: [],
                byAgeBucket: []
            }
        });
        expect(repository.deleteExpired).toHaveBeenCalledWith({
            limit: 25
        });
    });

    it('exposes cleanup status and stats helpers', async () => {
        const repository = buildRepository();
        const service = createIdempotencyService({
            commandIdempotencyRepository: repository,
            logger: createMockLogger()
        });

        const status = service.getCleanupStatus();
        const stats = await service.getCleanupStats();

        expect(status).toEqual(expect.objectContaining({
            running: false
        }));
        expect(stats).toEqual({
            byScopeStatus: [],
            byAgeBucket: []
        });
    });
});
