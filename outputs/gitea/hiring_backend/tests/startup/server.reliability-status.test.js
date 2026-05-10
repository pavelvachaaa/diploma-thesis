const { createMockLogger } = require('../helpers');

describe('startup rabbit consumer gating', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        jest.resetModules();
    });

    it('skips consumers when rabbit is not configured and consumers are optional', async () => {
        delete process.env.RABBITMQ_URL;
        process.env.RABBIT_CONSUMERS_REQUIRED = 'false';

        const { startRabbitConsumers } = require('../../src/startup/server');
        const container = {
            resolve: jest.fn()
        };

        const status = await startRabbitConsumers({
            container,
            logger: createMockLogger()
        });

        expect(status.ready).toBe(true);
        expect(status.configured).toBe(false);
        expect(status.required).toBe(false);
        expect(container.resolve).not.toHaveBeenCalled();
    });

    it('fails startup when rabbit consumers are required but rabbit is not configured', async () => {
        delete process.env.RABBITMQ_URL;
        process.env.RABBIT_CONSUMERS_REQUIRED = 'true';

        const { startRabbitConsumers } = require('../../src/startup/server');
        const container = {
            resolve: jest.fn()
        };

        await expect(startRabbitConsumers({
            container,
            logger: createMockLogger()
        })).rejects.toThrow('Rabbit consumers are required but RABBITMQ_URL is not configured');
    });

    it('fails startup when one consumer cannot start and consumers are required', async () => {
        process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672/';
        process.env.RABBIT_CONSUMERS_REQUIRED = 'true';

        const { startRabbitConsumers } = require('../../src/startup/server');
        const consumerOk = { start: jest.fn().mockResolvedValue(true) };
        const consumerFail = { start: jest.fn().mockRejectedValue(new Error('boom')) };
        const container = {
            resolve: jest.fn()
                .mockReturnValueOnce(consumerOk)
                .mockReturnValueOnce(consumerFail)
                .mockReturnValueOnce(consumerOk)
        };

        await expect(startRabbitConsumers({
            container,
            logger: createMockLogger()
        })).rejects.toThrow('Rabbit consumers are required and at least one consumer failed to start');
    });
});

describe('startup readiness status', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        jest.resetModules();
    });

    it('reports ready when db, outbox, consumers, and idempotency cleanup are healthy', async () => {
        process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672/';
        process.env.RABBIT_CONSUMERS_REQUIRED = 'false';

        const server = require('../../src/startup/server');
        const logger = createMockLogger();

        await server.initDbWithRetry({
            db: { query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) },
            logger,
            retries: 1,
            delay: 1
        });

        await server.startOutboxWorkers({
            container: {
                resolve: jest.fn().mockReturnValue({
                    isEnabled: jest.fn(() => true),
                    isWorkerEnabled: jest.fn(() => true),
                    start: jest.fn().mockResolvedValue(true)
                })
            },
            logger
        });

        await server.startRabbitConsumers({
            container: {
                resolve: jest.fn().mockReturnValue({
                    start: jest.fn().mockResolvedValue(true)
                })
            },
            logger
        });

        await server.startCommandIdempotencyCleanup({
            container: {
                resolve: jest.fn().mockReturnValue({
                    startCleanup: jest.fn().mockResolvedValue(true),
                    getCleanupStatus: jest.fn().mockReturnValue({
                        enabled: true,
                        running: true,
                        lastRunAt: new Date().toISOString(),
                        lastDeleted: 0,
                        lastError: null
                    })
                })
            },
            logger
        });

        const readiness = server.getReadinessStatus();

        expect(readiness.ready).toBe(true);
        expect(readiness.status).toBe('ready');
        expect(readiness.components.db.ready).toBe(true);
        expect(readiness.components.outboxWorker.ready).toBe(true);
        expect(readiness.components.rabbitConsumers.ready).toBe(true);
        expect(readiness.components.idempotencyCleanup.ready).toBe(true);
    });
});
