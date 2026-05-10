module.exports = ({
    sideEffectOutboxService,
    detectBucketFromKey,
}) => {
    const isOutboxEnabled = () => sideEffectOutboxService?.isEnabled?.() === true;
    const assertOutboxEnabled = () => {
        if (!isOutboxEnabled()) {
            throw new Error('Side effect outbox must be enabled for interview email delivery');
        }
    };

    const buildStorageAttachmentReference = (attachment) => {
        return {
            filename: attachment.original_filename,
            contentType: attachment.mime_type,
            storage: {
                bucket: attachment.bucket || detectBucketFromKey(attachment.file_path),
                key: attachment.file_path
            }
        };
    };

    const sendOrQueueInterviewEmail = async (
        { to, subject, text, html, attachments = [], icalEvent = null, audit = {} },
        { interviewId = null, organizationId = null, dedupeKey = null } = {}
    ) => {
        assertOutboxEnabled();

        const event = await sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.RAW_EMAIL,
            aggregateType: 'interview',
            aggregateId: interviewId,
            organizationId,
            payload: {
                to,
                subject,
                text,
                html,
                attachments: sideEffectOutboxService.normalizeAttachmentsForPayload(attachments),
                icalEvent: sideEffectOutboxService.normalizeIcalEventForPayload(icalEvent),
                audit
            }
        }, {
            idempotencyKey: dedupeKey
        });

        return {
            queued: true,
            sent: false,
            outboxId: event?.id || null,
            messageId: null
        };
    };

    return {
        sendOrQueueInterviewEmail,
        buildStorageAttachmentReference,
        isOutboxEnabled
    };
};
