const createChatRepository = require('../../src/domain/chat/repository');

describe('chat repository SQL regressions', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn()
        };
        repository = createChatRepository({ db });
    });

    it('normalizes conversation pair when deleting a conversation', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 2 });

        await repository.deleteConversation(
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('WHERE convo_a = $1');
        expect(sql).toContain('AND convo_b = $2');
        expect(params).toEqual([
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        ]);
    });

    it('keeps explicit casts in markReadUpTo query', async () => {
        db.query
            .mockResolvedValueOnce({
                rows: [{
                    created_at: '2026-03-23T12:00:00.000Z',
                    sender_id: 'peer-id',
                    recipient_id: 'self-id'
                }]
            })
            .mockResolvedValueOnce({ rows: [{ message_id: 'm-1' }] });

        await repository.markReadUpTo({
            currentUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            withUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            upToMessageId: '99999999-9999-4999-8999-999999999999'
        });

        const [sql] = db.query.mock.calls[1];
        expect(sql).toContain('$1::uuid');
        expect(sql).toContain('$5::timestamp');
        expect(sql).toContain('dm.id::text <= $6::text');
    });
});
