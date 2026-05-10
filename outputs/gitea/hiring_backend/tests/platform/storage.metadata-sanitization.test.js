const createStorage = require('@platform/storage');

const createLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn()
});

describe('platform/storage metadata sanitization', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('drops invalid custom metadata values and keeps upload running', async () => {
        const logger = createLogger();
        const storage = createStorage({ logger });
        storage.client = { send: jest.fn().mockResolvedValue({}) };
        storage.init = jest.fn();

        await storage.upload('documents', 'user-documents/file.pdf', Buffer.from('file-bytes'), {
            contentType: 'application/pdf',
            custom: {
                context: 'user-documents',
                originalName: 'Žluťoučký kůň 2026 životopis.pdf',
                retryCount: 2,
                retained: false,
                invalidObject: { nested: true },
                'bad key': 'value',
                nullable: null
            }
        });

        expect(storage.client.send).toHaveBeenCalledTimes(1);
        const command = storage.client.send.mock.calls[0][0];
        expect(command.input.Metadata).toEqual({
            context: 'user-documents',
            retrycount: '2',
            retained: 'false'
        });

        expect(logger.warn).toHaveBeenCalledWith('Dropped invalid storage metadata entries', expect.objectContaining({
            bucket: 'documents',
            key: 'user-documents/file.pdf',
            dropped: expect.arrayContaining([
                expect.objectContaining({ key: 'originalName', reason: 'non_ascii_value' }),
                expect.objectContaining({ key: 'invalidObject', reason: 'unsupported_value_type' }),
                expect.objectContaining({ key: 'bad key', reason: 'invalid_key' }),
                expect.objectContaining({ key: 'nullable', reason: 'nullish_value' })
            ])
        }));
    });

    it('does not warn when metadata is already safe', async () => {
        const logger = createLogger();
        const storage = createStorage({ logger });
        storage.client = { send: jest.fn().mockResolvedValue({}) };
        storage.init = jest.fn();

        await storage.upload('documents', 'user-documents/file.pdf', Buffer.from('file-bytes'), {
            contentType: 'application/pdf',
            custom: {
                context: 'user-documents',
                source: 'contacts-form'
            }
        });

        const command = storage.client.send.mock.calls[0][0];
        expect(command.input.Metadata).toEqual({
            context: 'user-documents',
            source: 'contacts-form'
        });
        expect(logger.warn).not.toHaveBeenCalled();
    });
});
