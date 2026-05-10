const createAttachments = require('@domain/interviews/service/attachments');
const { createMockLogger } = require('../../../helpers');

describe('interviews attachments use-cases', () => {
    it('deleteAttachment marks file retained and enqueues outbox GC in transaction', async () => {
        const txClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        txClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({}); // COMMIT

        const calendarRepository = {
            deleteAttachment: jest.fn().mockResolvedValue({
                id: 'att-1',
                file_id: 'file-1'
            })
        };
        const fileGateway = {
            markRetained: jest.fn().mockResolvedValue({
                id: 'file-1',
                retention_until: '2026-04-01T00:00:00.000Z'
            })
        };
        const sideEffectOutboxService = {
            enqueue: jest.fn(),
            enqueueFileGcDelete: jest.fn().mockResolvedValue({ id: 'outbox-1' })
        };
        const db = {
            getClient: jest.fn().mockResolvedValue(txClient)
        };
        const logger = createMockLogger();

        const attachments = createAttachments({
            calendarRepository,
            sideEffectOutboxService,
            fileGateway,
            db,
            logger
        });

        const result = await attachments.deleteAttachment('att-1', 'user-1');

        expect(result).toBe(true);
        expect(db.getClient).toHaveBeenCalledTimes(1);
        expect(fileGateway.markRetained).toHaveBeenCalledWith('file-1', expect.objectContaining({
            client: txClient
        }));
        expect(sideEffectOutboxService.enqueueFileGcDelete).toHaveBeenCalledWith(
            expect.objectContaining({
                fileId: 'file-1',
                sourceModule: 'interviews.deleteAttachment'
            }),
            expect.objectContaining({
                client: txClient
            })
        );
        expect(txClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(txClient.query).toHaveBeenNthCalledWith(2, 'COMMIT');
        expect(txClient.release).toHaveBeenCalledTimes(1);
    });

    it('uses injected transactionManager for deleteAttachment (no db.getClient fallback)', async () => {
        const txClient = { query: jest.fn(), release: jest.fn() };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback, options) => {
                expect(options).toEqual(expect.objectContaining({
                    label: 'interviews.deleteAttachment'
                }));
                return callback(txClient);
            })
        };
        const calendarRepository = {
            deleteAttachment: jest.fn().mockResolvedValue({
                id: 'att-1',
                file_id: 'file-1'
            })
        };
        const fileGateway = {
            markRetained: jest.fn().mockResolvedValue({
                id: 'file-1',
                retention_until: '2026-04-01T00:00:00.000Z'
            })
        };
        const sideEffectOutboxService = {
            enqueue: jest.fn(),
            enqueueFileGcDelete: jest.fn().mockResolvedValue({ id: 'outbox-1' })
        };
        const db = {
            getClient: jest.fn()
        };
        const logger = createMockLogger();
        const attachments = createAttachments({
            calendarRepository,
            sideEffectOutboxService,
            fileGateway,
            db,
            transactionManager,
            logger
        });

        const result = await attachments.deleteAttachment('att-1', 'user-1');

        expect(result).toBe(true);
        expect(transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
        expect(db.getClient).not.toHaveBeenCalled();
        expect(fileGateway.markRetained).toHaveBeenCalledWith('file-1', expect.objectContaining({
            client: txClient
        }));
    });
});
