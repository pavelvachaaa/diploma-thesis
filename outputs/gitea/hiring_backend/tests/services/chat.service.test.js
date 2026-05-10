const createChatService = require('../../src/domain/chat/service');
const { createMockLogger } = require('../helpers');

const createDependencies = () => {
    const transactionClient = { query: jest.fn() };

    return {
        chatRepository: {
            withTransaction: jest.fn(async (callback) => callback(transactionClient)),
            createMessage: jest.fn(async () => ({
                id: 'msg-1',
                sender_id: '00000000-0000-4000-8000-000000000001',
                recipient_id: '00000000-0000-4000-8000-000000000002',
                body: 'Ahoj',
                created_at: '2026-03-07T10:00:00.000Z'
            })),
            addAttachments: jest.fn(async () => ([
                {
                    id: 'att-1',
                    original_filename: 'resume.pdf',
                    mime_type: 'application/pdf',
                    file_size: 100
                }
            ]))
        },
        chatAccessPolicy: {
            assertPeerAccessible: jest.fn(async () => {}),
            filterThreads: jest.fn(async (_user, threads) => threads),
            getAllowedPeers: jest.fn(async () => [])
        },
        notificationUrlPort: {
            generateNotificationUrlForUser: jest.fn(async () => '/chat?with=00000000-0000-4000-8000-000000000001'),
        },
        sideEffectOutboxService: {
            enqueue: jest.fn(async () => ({ id: 'gc-outbox-1' })),
            enqueueUserNotification: jest.fn(async () => ({ id: 'outbox-1' }))
        },
        fileGateway: {
            createFileRecord: jest.fn(async () => ({ id: 'file-1' }))
        },
        logger: createMockLogger()
    };
};

describe('chat.service', () => {
    it('writes chat message and notification intent in one transaction', async () => {
        const deps = createDependencies();
        const service = createChatService(deps);

        const result = await service.sendMessageWithAttachments(
            '00000000-0000-4000-8000-000000000001',
            '00000000-0000-4000-8000-000000000002',
            'Ahoj',
            [
                {
                    key: 'chat-attachments/file-1.pdf',
                    originalname: 'resume.pdf',
                    mimetype: 'application/pdf',
                    size: 100
                }
            ]
        );

        expect(deps.chatRepository.withTransaction).toHaveBeenCalledTimes(1);
        expect(deps.chatRepository.createMessage).toHaveBeenCalledWith(expect.objectContaining({
            senderId: '00000000-0000-4000-8000-000000000001',
            recipientId: '00000000-0000-4000-8000-000000000002'
        }), expect.objectContaining({ client: expect.any(Object) }));
        expect(deps.sideEffectOutboxService.enqueueUserNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: '00000000-0000-4000-8000-000000000002',
                type: 'chat.message',
                data: expect.objectContaining({ messageId: 'msg-1' })
            }),
            expect.objectContaining({
                client: expect.any(Object),
                aggregateType: 'chat_message',
                aggregateId: 'msg-1'
            })
        );
        expect(result).toEqual(expect.objectContaining({
            id: 'msg-1',
            senderId: '00000000-0000-4000-8000-000000000001',
            recipientId: '00000000-0000-4000-8000-000000000002',
            attachments: [expect.objectContaining({ id: 'att-1' })]
        }));
    });

    it('fails message write when outbox enqueue fails inside transaction', async () => {
        const deps = createDependencies();
        deps.sideEffectOutboxService.enqueueUserNotification.mockRejectedValueOnce(new Error('outbox unavailable'));
        const service = createChatService(deps);

        await expect(service.sendMessageWithAttachments(
            '00000000-0000-4000-8000-000000000001',
            '00000000-0000-4000-8000-000000000002',
            'Ahoj',
            []
        )).rejects.toThrow('outbox unavailable');

    });
});
