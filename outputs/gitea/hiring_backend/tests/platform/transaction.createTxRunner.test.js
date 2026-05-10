const createTxRunner = require('@platform/transaction/createTxRunner');
const { createMockLogger } = require('../helpers');

jest.mock('@shared/requestContext', () => ({
    getRequestContext: jest.fn(() => ({ requestId: 'req-1' }))
}));

describe('createTxRunner', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('delegates runInTransaction to transactionManager when provided', async () => {
        const db = {
            getClient: jest.fn()
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback, options) => {
                expect(options).toEqual(expect.objectContaining({
                    label: 'custom.label'
                }));
                return callback('tx-client');
            })
        };
        const runner = createTxRunner({
            db,
            transactionManager,
            logger: createMockLogger(),
            defaultLabel: 'default.label'
        });

        const result = await runner.runInTransaction(async (client) => {
            expect(client).toBe('tx-client');
            return 'ok';
        }, { label: 'custom.label' });

        expect(result).toBe('ok');
        expect(db.getClient).not.toHaveBeenCalled();
        expect(transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
    });

    it('uses db fallback transaction path and commits on success', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };
        const db = {
            getClient: jest.fn().mockResolvedValue(client)
        };
        const logger = createMockLogger();
        const runner = createTxRunner({
            db,
            logger,
            defaultLabel: 'fallback.label'
        });

        const result = await runner.runInTransaction(async () => 'done');

        expect(result).toBe('done');
        expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(client.query).toHaveBeenNthCalledWith(2, 'COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
        expect(logger.debug).toHaveBeenCalledWith('Transaction committed', expect.objectContaining({
            label: 'fallback.label',
            request_id: 'req-1'
        }));
    });

    it('uses db fallback transaction path and rolls back on error', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };
        const db = {
            getClient: jest.fn().mockResolvedValue(client)
        };
        const logger = createMockLogger();
        const runner = createTxRunner({
            db,
            logger,
            defaultLabel: 'rollback.label'
        });

        await expect(runner.runInTransaction(async () => {
            throw new Error('boom');
        })).rejects.toThrow('boom');

        expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
        expect(client.release).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith('Transaction rolled back', expect.objectContaining({
            label: 'rollback.label',
            request_id: 'req-1',
            error: 'boom'
        }));
    });

    it('preserves original error when rollback fails and logs rollback failure', async () => {
        const client = {
            query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockRejectedValueOnce(new Error('rollback failed')), // ROLLBACK
            release: jest.fn()
        };
        const db = {
            getClient: jest.fn().mockResolvedValue(client)
        };
        const logger = createMockLogger();
        const runner = createTxRunner({
            db,
            logger,
            defaultLabel: 'rollback.failure.label'
        });

        await expect(runner.runInTransaction(async () => {
            throw new Error('original failure');
        })).rejects.toThrow('original failure');

        expect(logger.error).toHaveBeenCalledWith('Transaction rollback failed', expect.objectContaining({
            label: 'rollback.failure.label',
            error: 'rollback failed'
        }));
        expect(logger.warn).toHaveBeenCalledWith('Transaction rolled back', expect.objectContaining({
            label: 'rollback.failure.label',
            error: 'original failure',
            rollback_error: 'rollback failed'
        }));
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('runWriteWithOutbox executes write and enqueue in one transaction', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };
        const db = {
            getClient: jest.fn().mockResolvedValue(client)
        };
        const runner = createTxRunner({
            db,
            logger: createMockLogger(),
            defaultLabel: 'write.outbox'
        });

        const write = jest.fn().mockResolvedValue({ id: 'entity-1' });
        const enqueue = jest.fn().mockResolvedValue({ id: 'outbox-1' });

        const result = await runner.runWriteWithOutbox({
            label: 'custom.write.outbox',
            write,
            enqueue
        });

        expect(result).toEqual({
            writeResult: { id: 'entity-1' },
            outboxResult: { id: 'outbox-1' }
        });
        expect(write).toHaveBeenCalledWith({ client });
        expect(enqueue).toHaveBeenCalledWith({
            client,
            writeResult: { id: 'entity-1' }
        });
    });

    it('runWriteWithOutbox supports write-only execution when enqueue is omitted', async () => {
        const client = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };
        const db = {
            getClient: jest.fn().mockResolvedValue(client)
        };
        const runner = createTxRunner({
            db,
            logger: createMockLogger(),
            defaultLabel: 'write.only'
        });

        const write = jest.fn().mockResolvedValue({ id: 'entity-1' });
        const result = await runner.runWriteWithOutbox({ write });

        expect(result).toEqual({
            writeResult: { id: 'entity-1' },
            outboxResult: null
        });
        expect(write).toHaveBeenCalledWith({ client });
    });

    it('runWriteWithOutbox delegates to transactionManager.runWriteWithOutbox when available', async () => {
        const db = {
            getClient: jest.fn()
        };
        const transactionManager = {
            runInTransaction: jest.fn(),
            runWriteWithOutbox: jest.fn().mockResolvedValue({ delegated: true })
        };
        const runner = createTxRunner({
            db,
            transactionManager,
            logger: createMockLogger(),
            defaultLabel: 'delegated.write.outbox'
        });

        const write = jest.fn();
        const enqueue = jest.fn();
        const result = await runner.runWriteWithOutbox({
            write,
            enqueue
        });

        expect(result).toEqual({ delegated: true });
        expect(transactionManager.runWriteWithOutbox).toHaveBeenCalledWith(expect.objectContaining({
            label: 'delegated.write.outbox.write_outbox',
            write,
            enqueue
        }));
        expect(db.getClient).not.toHaveBeenCalled();
    });
});
