const createEmailDispatch = require('@domain/interviews/service/shared/emailDispatch');
const { detectBucketFromKey } = require('@domain/interviews/service/shared/storage')();

describe('interviews email dispatcher', () => {
    it('queues email via outbox when enabled', async () => {
        const sideEffectOutboxService = {
            isEnabled: jest.fn().mockReturnValue(true),
            EVENT_TYPES: {
                RAW_EMAIL: 'email.raw.v1'
            },
            enqueue: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
            normalizeAttachmentsForPayload: jest.fn((attachments) => attachments),
            normalizeIcalEventForPayload: jest.fn((icalEvent) => icalEvent)
        };

        const dispatcher = createEmailDispatch({
            sideEffectOutboxService,
            detectBucketFromKey,
        });

        const result = await dispatcher.sendOrQueueInterviewEmail({
            to: 'a@example.com',
            subject: 'Test',
            text: 'Body',
            html: '<p>Body</p>'
        }, {
            interviewId: 'interview-1',
            organizationId: 'org-1'
        });

        expect(result).toEqual({
            queued: true,
            sent: false,
            outboxId: 'outbox-1',
            messageId: null
        });
        expect(sideEffectOutboxService.enqueue).toHaveBeenCalled();
    });

    it('fails when outbox is disabled (no direct fallback)', async () => {
        const sideEffectOutboxService = {
            isEnabled: jest.fn().mockReturnValue(false)
        };

        const dispatcher = createEmailDispatch({
            sideEffectOutboxService,
            detectBucketFromKey,
        });

        await expect(dispatcher.sendOrQueueInterviewEmail({
            to: 'a@example.com',
            subject: 'Test',
            text: 'Body',
            html: '<p>Body</p>'
        })).rejects.toThrow('Side effect outbox must be enabled for interview email delivery');
    });
});
