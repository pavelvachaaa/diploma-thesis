const { startOutboxWorkers, startCommandIdempotencyCleanup } = require('../../src/startup/server');
const { createMockLogger } = require('../helpers');

describe('startup outbox policy', () => {
    it('starts side effect outbox worker when enabled', async () => {
        const start = jest.fn().mockResolvedValue(true);
        const container = {
            resolve: jest.fn().mockReturnValue({
                isEnabled: jest.fn(() => true),
                isWorkerEnabled: jest.fn(() => true),
                start
            })
        };

        const status = await startOutboxWorkers({
            container,
            logger: createMockLogger()
        });

        expect(status).toEqual({
            'side-effect': true,
            any: true
        });
        expect(start).toHaveBeenCalledTimes(1);
    });

    it('fails startup when side effect outbox is disabled', async () => {
        const container = {
            resolve: jest.fn().mockReturnValue({
                isEnabled: jest.fn(() => false),
                isWorkerEnabled: jest.fn(() => true),
                start: jest.fn()
            })
        };

        await expect(startOutboxWorkers({
            container,
            logger: createMockLogger()
        })).rejects.toThrow('side-effect outbox must be enabled');
    });

    it('fails startup when side effect outbox worker does not start', async () => {
        const container = {
            resolve: jest.fn().mockReturnValue({
                isEnabled: jest.fn(() => true),
                isWorkerEnabled: jest.fn(() => true),
                start: jest.fn().mockResolvedValue(false)
            })
        };

        await expect(startOutboxWorkers({
            container,
            logger: createMockLogger()
        })).rejects.toThrow('side-effect outbox worker failed to start');
    });
});

describe('startup command idempotency cleanup', () => {
    it('starts cleanup scheduler when enabled', async () => {
        const startCleanup = jest.fn().mockResolvedValue(true);
        const container = {
            resolve: jest.fn().mockReturnValue({
                startCleanup
            })
        };

        await startCommandIdempotencyCleanup({
            container,
            logger: createMockLogger()
        });

        expect(startCleanup).toHaveBeenCalledTimes(1);
    });
});
