const createAuditTrailAdapter = require('../../src/adapters/out/integration/contactInquiries/auditTrail');

describe('contactInquiries auditTrail adapter', () => {
    const createAdapter = (auditOverrides = {}) => {
        const audit = { writeAuditEvent: jest.fn().mockResolvedValue(undefined), ...auditOverrides };
        const logger = { warn: jest.fn() };
        return { adapter: createAuditTrailAdapter({ audit, logger }), audit, logger };
    };

    describe('recordInquirySubmitted', () => {
        it('translates a ContactInquiry.Submitted domain event to audit service JSON', async () => {
            const { adapter, audit } = createAdapter();

            adapter.recordInquirySubmitted({
                type: 'ContactInquiry.Submitted',
                inquiryId: 'ci-1',
                email: 'john@example.com',
                hasPhone: false,
                messageLength: 42
            });
            await Promise.resolve();

            expect(audit.writeAuditEvent).toHaveBeenCalledWith({
                source: 'public',
                category: 'contact_inquiry',
                action: 'contact_inquiry.submit',
                status: 'success',
                resourceType: 'contact_inquiry',
                resourceId: 'ci-1',
                captureState: false,
                metadata: {
                    email: 'john@example.com',
                    hasPhone: false,
                    gdprConsent: true,
                    messageLength: 42
                }
            });
        });

        it('returns null synchronously (fire-and-forget)', () => {
            const { adapter } = createAdapter();
            const result = adapter.recordInquirySubmitted({ type: 'ContactInquiry.Submitted', inquiryId: 'ci-1', email: 'x@x.com', hasPhone: false, messageLength: 5 });
            expect(result).toBeNull();
        });
    });

    describe('recordInquiryReplied', () => {
        it('translates a ContactInquiry.Replied domain event to audit service JSON', async () => {
            const { adapter, audit } = createAdapter();

            adapter.recordInquiryReplied({
                type: 'ContactInquiry.Replied',
                inquiryId: 'ci-1',
                actorUserId: 'admin-1',
                actorEmail: 'admin@kzcr.eu',
                inquiryEmail: 'john@example.com',
                isFirstReply: true,
                subject: 'Re: dotaz',
                replyLength: 120
            });
            await Promise.resolve();

            expect(audit.writeAuditEvent).toHaveBeenCalledWith({
                category: 'contact_inquiry',
                action: 'contact_inquiry.reply',
                status: 'success',
                resourceType: 'contact_inquiry',
                resourceId: 'ci-1',
                actorUserId: 'admin-1',
                actorEmail: 'admin@kzcr.eu',
                captureState: false,
                metadata: {
                    inquiryEmail: 'john@example.com',
                    isFirstReply: true,
                    subject: 'Re: dotaz',
                    replyLength: 120
                }
            });
        });

        it('swallows audit failures and logs a warning', async () => {
            const { adapter, logger } = createAdapter({
                writeAuditEvent: jest.fn().mockRejectedValue(new Error('audit down'))
            });

            expect(adapter.recordInquiryReplied({
                type: 'ContactInquiry.Replied',
                inquiryId: 'ci-1',
                actorUserId: null,
                actorEmail: null,
                inquiryEmail: 'j@ex.com',
                isFirstReply: false,
                subject: 'Re',
                replyLength: 3
            })).toBeNull();
            await Promise.resolve();

            expect(logger.warn).toHaveBeenCalledWith('Failed to emit contact inquiry audit event', {
                error: 'audit down',
                action: 'contact_inquiry.reply'
            });
        });
    });
});
